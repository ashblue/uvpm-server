import { CtrlPackage } from './ctrl-package';
import request = require('supertest');
import * as chai from 'chai';
// import { IModelUser } from '../../models/user/i-model-user';
import { App } from '../../app';

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

  it('should initialize', () => {
    const ctrl = new CtrlPackage(app.db);

    expect(ctrl).to.be.ok;
  });

  describe('when initialized', () => {
    const routePackages = '/packages';

    let ctrl: CtrlPackage;
    // let user: IModelUser;
    let token: string;

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
              // user = res.body.user;
              done();
            });
        });
    });

    describe('create', () => {
      it('should create a new package with a version', (done) => {
        request(app.express)
          .post(routePackages)
          .set('Authorization', token)
          .send({
            name: 'asdf',
            version: '1.0.0',
            archive: 'FILE_HERE',
            description: 'My description',
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            expect(err).to.not.be.ok;
            expect(res.body).to.haveOwnProperty('name');
            expect(res.body).to.haveOwnProperty('packages');
            expect(res.body.packages).to.be.ok;
            expect(res.body.packages.length).to.equal(1);
            expect(res.body.packages[0]).to.haveOwnProperty('version');
            expect(res.body.packages[0]).to.haveOwnProperty('archive');
            expect(res.body.packages[0]).to.haveOwnProperty('description');
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
            expect(res.body.errors.name.message).to.contain('Name is required');
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
            expect(res.body.errors.archive.message).to.contain('`archive` is required');
            done();
          });
      });

      xit('should fail if a version is not provided', () => {
        console.log('placeholder');
      });

      xit('should fail if the name is already taken', () => {
        console.log('placeholder');
      });

      xit('should attach the user to the newly created package', () => {
        console.log('placeholder');
      });

      xit('should fail if the version creation returns an error', () => {
        console.log('placeholder');
      });

      xit('should fail if the package details are invalid', () => {
        console.log('placeholder');
      });

      xit('should delete the version if package creation fails', () => {
        console.log('placeholder');
      });
    });
  });
});
