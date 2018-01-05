import * as express from 'express';
import {Database} from '../databases/database';
import {appConfig} from '../../helpers/app-config';
import {CtrlUser} from './ctrl-user';
import passport = require('passport');

import request = require('supertest');
import bodyParser = require('body-parser');

import * as chai from 'chai';
import {IModelUser} from '../../models/user/model-user';
const expect = chai.expect;

describe('CtrlUser', () => {
  let db: Database;

  beforeEach((done) => {
    db = new Database(appConfig.DB_DEFAULT_URL, (dbRef) => {
      dbRef.connection.db.dropDatabase().then(() => {
        done();
      });
    });
  });

  afterEach((done) => {
    db.closeConnection(done);
  });

  it('should initialize', () => {
     const ctrl = new CtrlUser(db);

     expect(ctrl).to.be.ok;
  });

  describe('when initialized', () => {
    let ctrl: CtrlUser;
    let app: express.Application;

    const userData = {
      name: 'Lorem Ipsum',
      email: 'asdf@asdf.com',
      password: 'asdfasd1',
    };

    beforeEach(() => {
      ctrl = new CtrlUser(db);
      app = express();
      app.use(bodyParser.json());
      app.use(passport.initialize());

      app.post('/users', (req, res) => {
        ctrl.register(req, res);
      });

      app.put('/users/:userId', (req, res, next) => {
        ctrl.authenticate(req, res, next, () => {
          ctrl.update(req, res);
        });
      });

      app.post('/users/login', (req, res) => {
        ctrl.login(req, res);
      });
    });

    describe('register', () => {
      it('should register a user', (done) => {
        request(app)
          .post('/users')
          .send({
            name: 'Lorem Ipsum',
            email: 'asdf@asdf.com',
            password: 'asdfasd1',
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) {
              console.log(res.error);
            }

            expect(err).to.be.not.ok;
            expect(res.body.name).to.be.ok;
            expect(res.body.email).to.be.ok;
            expect(res.body.password).to.not.be.ok;

            done();
          });
      });

      it('should return an error if registration fails', (done) => {
        request(app)
          .post('/users')
          .send({})
          .expect('Content-Type', /json/)
          .expect(500)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res.body.errors).to.be.ok;

            done();
          });
      });
    });

    describe('login', () => {
      beforeEach((done) => {
        request(app)
          .post('/users')
          .send(userData)
          .expect(200)
          .end((err, res) => {
            expect(err).to.be.not.ok;
            done();
          });
      });

      it('should fail if password is incorrect', (done) => {
        request(app)
          .post('/users/login')
          .send({
            email: userData.email,
            password: 'asdf',
          })
          .expect('Content-Type', /json/)
          .expect(401)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.message).to.contain('Invalid login credentials');
            done();
          });
      });

      it('should fail if email is incorrect', (done) => {
        request(app)
          .post('/users/login')
          .send({
            email: 'asdf',
            password: userData.password,
          })
          .expect('Content-Type', /json/)
          .expect(401)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.message).to.contain('Invalid login credentials');
            done();
          });
      });

      it('should validate login if already registered', (done) => {
        request(app)
          .post('/users/login')
          .send(userData)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            done();
          });
      });

      it('should return a token upon success', (done) => {
        request(app)
          .post('/users/login')
          .send(userData)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.token).to.be.ok;
            done();
          });
      });

      it('should return a user upon success', (done) => {
        request(app)
          .post('/users/login')
          .send(userData)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.user).to.be.ok;
            done();
          });
      });
    });

    describe('authenticate', () => {
      beforeEach((done) => {
        app.get('/users/auth', (req, res, next) => {
          ctrl.authenticate(req, res, next, () => {
            res.send({message: 'success'});
          });
        });

        request(app)
          .post('/users')
          .send(userData)
          .expect(200)
          .end((err, res) => {
            done();
          });
      });

      it('should return error message if provided JWT token is invalid', (done) => {
        request(app)
          .get('/users/auth')
          .set('Authorization', 'Bearer asdf')
          .expect(401)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.message).to.contain('Authentication failed');
            done();
          });
      });

      it('should return true if provided JWT token is valid', (done) => {
        request(app)
          .post('/users/login')
          .send(userData)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            expect(err).to.not.be.ok;

            const token = res.body.token;
            request(app)
              .get('/users/auth')
              .set('Authorization', 'Bearer ' + token)
              .expect('Content-Type', /json/)
              .expect(200)
              .end((err, res) => {
                expect(err).to.not.be.ok;
                expect(res.body.message).to.contain('success');
                done();
              });
          });
      });
    });

    describe('update', () => {
      let token: string;
      let user: IModelUser;

      beforeEach((done) => {
        request(app)
          .post('/users')
          .send(userData)
          .expect(200)
          .end((err, res) => {
            expect(err).to.be.not.ok;

            request(app)
              .post('/users/login')
              .send(userData)
              .expect(200)
              .end((err, res) => {
                token = `Bearer ${res.body.token}`;
                user = res.body.user;
                done();
              });
          });
      });

      it('should fail when trying to update a non existent ID', (done) => {
        request(app)
          .put('/users/12345')
          .set('Authorization', token)
          .send({
            name: 'asdfd',
          })
          .expect(401)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.message).to.contain('Access denied');
            done();
          });
      });

      it('should not let a non authenticated user update credentials', (done) => {
        request(app)
          .put(`/users/${user.id}`)
          .send({
            name: 'asdfd',
          })
          .expect(401)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.message).to.contain('Authentication failed');
            done();
          });
      });

      it('should not let a different user update credentials', (done) => {
        request(app)
          .post('/users')
          .send({
            name: 'fdsa',
            email: 'fdsa@fdsa.com',
            password: 'asdfasd1',
          })
          .expect(200)
          .end((err, res) => {
            expect(err).to.be.not.ok;

            request(app)
              .post('/users/login')
              .send({
                email: 'fdsa@fdsa.com',
                password: 'asdfasd1',
              })
              .expect(200)
              .end((err, res) => {
                const token2 = `Bearer ${res.body.token}`;

                request(app)
                  .put(`/users/${user.id}`)
                  .set('Authorization', token2)
                  .send({name: 'fdsa'})
                  .expect(401)
                  .end((err, res) => {
                    expect(err).to.not.be.ok;
                    expect(res.body.message).to.contain('Access denied');
                    done();
                  });
              });
          });
      });

      describe('name', () => {
        xit('should let a user change their name', (done) => {
          request(app)
            .put(`/users/${user.id}`)
            .set('Authorization', token)
            .send({
              name: 'fdsa dsdfsddd',
            })
            .expect(200)
            .end((err, res) => {
              expect(err).to.not.be.ok;
              expect(res.body.name).to.contain('fdsa dsdfsddd');
              done();
            });
        });

        xit('should not let a user set their name to null', () => {
          console.log('placeholder');
        });

        xit('should not let a user set their name to undefined', () => {
          console.log('placeholder');
        });

        xit('should not let a user set their name to an empty string', () => {
          console.log('placeholder');
        });
      });

      describe('email', () => {
        xit('should let a user update the value', () => {
          console.log('placeholder');
        });

        xit('should not let a user enter an invalid email', () => {
          console.log('placeholder');
        });

        xit('should not let a user set their name to null', () => {
          console.log('placeholder');
        });

        xit('should not let a user set their name to undefined', () => {
          console.log('placeholder');
        });

        xit('should not let a user set their name to an empty string', () => {
          console.log('placeholder');
        });
      });

      describe('password', () => {
        xit('should let a user update the value with a confirmation field', () => {
          console.log('placeholder');
        });

        xit('should fail if a confirmation field is not provided', () => {
          console.log('placeholder');
        });

        xit('should reject invalid passwords', () => {
          console.log('placeholder');
        });

        xit('should not let a user set their password to null', () => {
          console.log('placeholder');
        });

        xit('should not let a user set their password to undefined', () => {
          console.log('placeholder');
        });

        xit('should not let a user set their password to an empty string', () => {
          console.log('placeholder');
        });
      });
    });
  });
});
