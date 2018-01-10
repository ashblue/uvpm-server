import { App } from '../../../../app';
import request = require('supertest');

import * as chai from 'chai';
const expect = chai.expect;

describe('RouteUsers', () => {
  let app: App;

  beforeEach((done) => {
    app = new App();
    app.db.connection.once('open', () => {
      app.db.connection.db.dropDatabase().then(() => {
        done();
      });
    });
  });

  afterEach((done) => {
    app.db.closeConnection(done);
  });

  it('should initialize', () => {
    expect(app.routes.v1).to.be.ok;
  });

  it('should not allow $ injections to skip registration details', (done) => {
    request(app.express)
      .post(`/api/v1/users`)
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
        expect(res.body.message).to.be.ok;
        done();
      });
  });

  it('should allow logins at /api/v1/users/login', (done) => {
    request(app.express)
      .post(`/api/v1/users`)
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
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.token).to.be.ok;
            done();
          });
      });
  });

  it('should allow registration at api/v1/users', (done) => {
    request(app.express)
      .post(`/api/v1/users`)
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
        expect(res.body.password).to.not.be.ok;
        done();
      });
  });

  it('should allow updates at api/v1/users/USER_ID', (done) => {
    const name = 'Roger';
    const newName = 'Asdf';

    request(app.express)
      .post(`/api/v1/users`)
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
          .end((err, res) => {
            expect(err).to.not.be.ok;

            const token = res.body.token;
            expect(token).to.be.ok;

            request(app.express)
              .put(`/api/v1/users/${id}`)
              .set('Authorization', `Bearer ${token}`)
              .send({
                name: newName,
              })
              .expect(200)
              .end((err, res) => {
                expect(err).to.not.be.ok;
                expect(res.body.name).to.equal(newName);
                done();
              });
          });
      });
  });

  it('should allow updates to authenticated users only', (done) => {
    const newName = 'Penis';

    createUser(app.express, {
      name: 'asdf',
      email: 'asdf@asdf.com',
      password: 'asdfasdf1',
    }, (user1) => {
      createUser(app.express, {
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

function createUser (app: Express.Application, newUser: IUserDetails, done: (user: IUserDetails) => void) {
  request(app)
    .post(`/api/v1/users`)
    .send(newUser)
    .expect(200)
    .end((err, res) => {
      expect(err).to.not.be.ok;

      request(app)
        .post(`/api/v1/users/login`)
        .send({
          email: newUser.email,
          password: newUser.password,
        })
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.be.ok;

          done({
            name: res.body.user.name,
            email: res.body.user.email,
            password: res.body.user.password,
            token: res.body.token,
          });
        });
    });
}
