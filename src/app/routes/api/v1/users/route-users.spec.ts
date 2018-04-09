import { App } from '../../../../app';
import request = require('supertest');
import { expect } from 'chai';
import { UserHelpers } from '../../../../helpers/user-helpers';

describe('RouteUsers', () => {
  let app: App;
  let adminToken: string;

  function createUser (newUser: IUserDetails, done: (user: IUserDetails) => void) {
    request(app.express)
      .post(`/api/v1/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newUser)
      .expect(200)
      .end((err, res) => {
        expect(err).to.not.be.ok;

        request(app.express)
          .post(`/api/v1/users/login`)
          .send({
            email: newUser.email,
            password: newUser.password,
          })
          .expect(200)
          .end((err2, res2) => {
            expect(err2).to.not.be.ok;

            done({
              name: res2.body.user.name,
              email: res2.body.user.email,
              password: res2.body.user.password,
              token: res2.body.token,
            });
          });
      });
  }

  beforeEach((done) => {
    app = new App();
    app.db.connection.once('connected', () => {
      app.db.connection.db.dropDatabase().then(() => {
        done();
      });
    });
  });

  beforeEach(async () => {
    adminToken = await UserHelpers.getToken(app.routes.v1.users.ctrlUser, app.db.models.User, 'admin');
  });

  afterEach((done) => {
    app.db.closeConnection(done);
  });

  it('should initialize', () => {
    expect(app.routes.v1.users).to.be.ok;
  });

  describe('register at api/v1/users', () => {
    let registerDetails: IUserDetails;

    beforeEach(() => {
      registerDetails = {
        name: 'asdff',
        email: 'fdsa@qwerty.com',
        password: 'asdfasdf1',
      };
    });

    it('should not allow unauthorized users', (done) => {
      request(app.express)
        .post(`/api/v1/users`)
        .send(registerDetails)
        .expect(401)
        .end((err) => {
          expect(err).to.not.be.ok;
          done();
        });
    });

    it('should allow admins', async () => {
      await new Promise((resolve) => {
        request(app.express)
          .post(`/api/v1/users`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .send(registerDetails)
          .end((err) => {
            expect(err).to.not.be.ok;
            resolve();
          });
      });
    });

    it('should not allow authors', async () => {
      const token = await UserHelpers.getToken(app.routes.v1.users.ctrlUser, app.db.models.User, 'author');

      await new Promise((resolve) => {
        request(app.express)
          .post(`/api/v1/users`)
          .set('Authorization', `Bearer ${token}`)
          .expect(401)
          .send(registerDetails)
          .end((err) => {
            expect(err).to.not.be.ok;
            resolve();
          });
      });
    });

    it('should not allow subscribers', async () => {
      const token = await UserHelpers.getToken(app.routes.v1.users.ctrlUser, app.db.models.User, 'subscriber');

      await new Promise((resolve) => {
        request(app.express)
          .post(`/api/v1/users`)
          .set('Authorization', `Bearer ${token}`)
          .expect(401)
          .send(registerDetails)
          .end((err) => {
            expect(err).to.not.be.ok;
            resolve();
          });
      });
    });
  });

  it('should not allow $ injections to skip registration details', (done) => {
    request(app.express)
      .post(`/api/v1/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: {
          $gt: '',
        },
        email: 'asdf@asdf.com',
        password: 'asdfasdf1',
      })
      .expect(200)
      .end((err, res) => {
        expect(err).to.not.be.ok;
        expect(res.body.name).to.contain('[object Object]');
        done();
      });
  });

  it('should not allow circumventing the login with NoSQL injections', (done) => {
    request(app.express)
      .post(`/api/v1/users/login`)
      .send({
        email: {
          $gt: '',
        },
        password: {
          $gt: '',
        },
      })
      .expect(401)
      .end((err, res) => {
        expect(err).to.not.be.ok;
        done();
      });
  });

  it('should allow logins at /api/v1/users/login', (done) => {
    request(app.express)
      .post(`/api/v1/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'asdf',
        email: 'asdf@asdf.com',
        password: 'asdfasdf1',
      })
      .expect(200)
      .end((err, res) => {
        expect(err).to.not.be.ok;
        expect(res.body.name).to.equal('asdf');
        expect(res.body.email).to.equal('asdf@asdf.com');

        request(app.express)
          .post(`/api/v1/users/login`)
          .send({
            email: 'asdf@asdf.com',
            password: 'asdfasdf1',
          })
          .expect(200)
          .end((err2, res2) => {
            expect(err2).to.not.be.ok;
            expect(res2.body.token).to.be.ok;
            done();
          });
      });
  });

  it('should allow updates at api/v1/users/USER_ID', (done) => {
    const name = 'Roger';
    const newName = 'Asdf';

    request(app.express)
      .post(`/api/v1/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name,
        email: 'asdf@asdf.com',
        password: 'asdfasdf1',
      })
      .expect(200)
      .end((err, res) => {
        expect(err).to.not.be.ok;

        const id = res.body.id;
        expect(id).to.be.ok;

        request(app.express)
          .post(`/api/v1/users/login`)
          .send({
            email: 'asdf@asdf.com',
            password: 'asdfasdf1',
          })
          .expect(200)
          .end((err2, res2) => {
            expect(err2).to.not.be.ok;

            const token = res2.body.token;
            expect(token).to.be.ok;

            request(app.express)
              .put(`/api/v1/users/${id}`)
              .set('Authorization', `Bearer ${token}`)
              .send({
                name: newName,
              })
              .expect(200)
              .end((err3, res3) => {
                expect(err3).to.not.be.ok;
                expect(res3.body.name).to.equal(newName);
                done();
              });
          });
      });
  });

  it('should allow updates to authenticated users only', (done) => {
    const newName = 'Penis';

    createUser({
      name: 'asdf',
      email: 'asdf@asdf.com',
      password: 'asdfasdf1',
    }, (user1) => {
      createUser({
        name: 'asdf',
        email: 'asdf@asdff.com',
        password: 'asdfasdf1',
      }, (user2) => {
        request(app.express)
          .put(`/api/v1/users/${user1.id}`)
          .set('Authorization', `Bearer ${user2.token}`)
          .send({
            name: newName,
          })
          .expect(401)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.name).not.equal(newName);
            done();
          });
      });
    });
  });
});

interface IUserDetails {
  id?: string;
  name: string;
  email: string;
  password: string;
  token?: string;
}
