import { CtrlPackage } from './ctrl-package';
import request = require('supertest');
import * as chai from 'chai';
import { IModelUser } from '../../models/user/i-model-user';
import { App } from '../../app';
import * as async from 'async';
import { fileHelper } from '../../helpers/file-creator';

const expect = chai.expect;

describe('CtrlPackage', () => {
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

  after((done) => {
    fileHelper.clearFileTestFolder((err) => {
      expect(err).to.be.not.ok;
      done();
    });
  });

  it('should initialize', () => {
    const ctrl = new CtrlPackage(app.db);

    expect(ctrl).to.be.ok;
  });

  describe('when initialized', () => {
    const routePackages = '/packages';

    let ctrl: CtrlPackage;
    let user: IModelUser;
    let token: string;
    let fileBase64: string;

    beforeEach((done) => {
      ctrl = new CtrlPackage(app.db);
      app.express.post(routePackages, (req, res, next) => {
        app.routes.v1.users.ctrlUser.authenticate(req, res, next, () => {
          ctrl.create(req, res);
        });
      });

      const userDetails = {
        name: 'asdf',
        email: 'asdf@asdf.com',
        password: 'asdfasdf1',
      };

      async.parallel([
        (callback) => {
          fileHelper.createBase64File(1, (base64) => {
            fileBase64 = base64;
            callback();
          });
        },
        (callback) => {
          request(app.express)
            .post('/api/v1/users')
            .send(userDetails)
            .expect(200)
            .end((err, res) => {
              expect(err).to.be.not.ok;

              request(app.express)
                .post('/api/v1/users/login')
                .send(userDetails)
                .expect(200)
                .end((err, res) => {
                  expect(err).to.not.be.ok;
                  expect(res.body).to.haveOwnProperty('user');

                  token = `Bearer ${res.body.token}`;
                  user = res.body.user;

                  callback();
                });
            });
        },
      ], () => {
        done();
      });
    });

    describe('create', () => {
      it('should create a new package with a name', (done) => {
        request(app.express)
          .post(routePackages)
          .set('Authorization', token)
          .send({
            name: 'asdf',
            version: '1.0.0',
            archive: fileBase64,
            description: 'My description',
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            expect(err).to.not.be.ok;

            expect(res.body).to.haveOwnProperty('name');
            expect(res.body).to.haveOwnProperty('versions');

            expect(res.body).to.haveOwnProperty('author');
            expect(res.body.author).to.haveOwnProperty('id');
            expect(res.body.author.id).to.equal(user.id);

            expect(res.body.versions).to.be.ok;
            expect(res.body.versions.length).to.equal(1);
            expect(res.body.versions[0]).to.haveOwnProperty('name');
            expect(res.body.versions[0]).to.haveOwnProperty('archive');
            expect(res.body.versions[0]).to.haveOwnProperty('description');
            done();
          });
      });

      it('should fail if the user isn\'t authenticated', (done) => {
        request(app.express)
          .post(routePackages)
          .send({
            name: 'asdf',
          })
          .expect('Content-Type', /json/)
          .expect(401)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.message).to.contain('Authentication failed');
            done();
          });
      });

      it('should fail if a name is not provided', (done) => {
        request(app.express)
          .post(routePackages)
          .set('Authorization', token)
          .send({
            version: '1.0.0',
            archive: 'FILE',
          })
          .expect('Content-Type', /json/)
          .expect(400)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.message).to.contain('Name is required');
            done();
          });
      });

      it('should fail if a file is not provided', (done) => {
        request(app.express)
          .post(routePackages)
          .set('Authorization', token)
          .send({
            name: 'asdf',
            version: '1.0.0',
          })
          .expect('Content-Type', /json/)
          .expect(400)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.errors.archive.message).to.contain('Version archive is required');
            done();
          });
      });

      it('should fail if a version is not provided', (done) => {
        request(app.express)
          .post(routePackages)
          .set('Authorization', token)
          .send({
            name: 'asdf',
            file: 'FILE',
          })
          .expect('Content-Type', /json/)
          .expect(400)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body.errors.name.message).to.contain('Version name is required');
            done();
          });
      });

      it('should fail if the name is already taken', (done) => {
        request(app.express)
          .post(routePackages)
          .set('Authorization', token)
          .send({
            name: 'asdf',
            version: '1.0.0',
            archive: 'FILE_HERE',
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err) => {
            expect(err).to.not.be.ok;

            request(app.express)
              .post(routePackages)
              .set('Authorization', token)
              .send({
                name: 'asdf',
                version: '1.0.0',
                archive: 'FILE_HERE',
              })
              .expect('Content-Type', /json/)
              .expect(400)
              .end((err, res) => {
                expect(err).to.not.be.ok;
                expect(res.body.message).contains('Name already in use');

                done();
              });
          });
      });
    });
  });
});
