import { CtrlPackage } from './ctrl-package';
import request = require('supertest');
import * as chai from 'chai';
import { IModelUser } from '../../models/user/i-model-user';
import { App } from '../../app';
import * as async from 'async';
import { fileHelper } from '../../helpers/file-helper';
import { IPackageData } from '../../models/package/i-package-data';
import { IModelPackage } from '../../models/package/i-model-package';

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
          ctrl.httpPost(req, res);
        });
      });

      app.express.get(`${routePackages}/:idPackage`, (req, res) => {
        ctrl.httpGet(req, res);
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
                .end((err2, res2) => {
                  expect(err2).to.not.be.ok;
                  expect(res2.body).to.haveOwnProperty('user');

                  token = `Bearer ${res2.body.token}`;
                  user = res2.body.user;

                  callback();
                });
            });
        },
      ], () => {
        done();
      });
    });

    describe('httpPost', () => {
      it('should receive a package model on success', (done) => {
        request(app.express)
          .post(routePackages)
          .set('Authorization', token)
          .send({
            name: 'asdf',
            versions: [{
              name: '1.0.0',
              archive: 'asdf',
              description: 'My description',
            }],
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            expect(err).to.not.be.ok;

            expect(res.body).to.be.ok;
            expect(res.body.id).to.be.ok;
            expect(res.body.author.password).to.not.be.ok;

            done();
          });
      });

      it('should return an error if the name is already in use', (done) => {
        request(app.express)
          .post(routePackages)
          .set('Authorization', token)
          .send({
            name: 'asdf',
            versions: [{
              name: '1.0.0',
              archive: 'asdf',
              description: 'My description',
            }],
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
                versions: [{
                  name: '1.0.0',
                  archive: 'asdf',
                  description: 'My description',
                }],
              })
              .expect('Content-Type', /json/)
              .expect(400)
              .end((err2, res) => {
                expect(err2).to.not.be.ok;
                expect(res.body.message).contains('Name already in use');

                done();
              });
          });
      });

      it('should error if the `package` name is missing', (done) => {
        request(app.express)
          .post(routePackages)
          .set('Authorization', token)
          .send({
            version: '1.0.0',
            archive: fileBase64,
            description: 'My description',
          })
          .expect('Content-Type', /json/)
          .expect(400)
          .end((err, res) => {
            expect(err).to.not.be.ok;

            expect(res.body).to.haveOwnProperty('message');
            expect(res.body.message).to.contain('Package name is required');

            done();
          });
      });

      it('should error if the user is not authenticated', (done) => {
        request(app.express)
          .post(routePackages)
          .send({
            name: 'asdf',
            version: '1.0.0',
            archive: fileBase64,
            description: 'My description',
          })
          .expect('Content-Type', /json/)
          .expect(401)
          .end((err, res) => {
            expect(err).to.not.be.ok;

            expect(res.body).to.haveOwnProperty('message');
            expect(res.body.message).to.contain('Authentication failed');

            done();
          });
      });
    });

    describe('create', () => {
      it('should fail gracefully if versions are empty', () => {
        const data: any = {
          name: 'asdf',
          author: user,
        };

        return ctrl.create(data)
          .then((res) => {
            chai.assert.fail(0, 1, res.toString());
          })
          .catch((err) => {
            expect(err).to.be.ok;
            expect(err.errors.versions.message).to.contain('at least one version to initialize');
          });
      });

      it('should create a new package with a nested version', () => {
        const data: IPackageData = {
          name: 'asdf',
          author: user,
          versions: [
            {
              name: '1.0.0',
              archive: fileBase64,
              description: 'My description',
            },
          ],
        };

        return ctrl.create(data)
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.id).to.be.ok;
            expect(res.name).to.eq(data.name);

            expect(res.author).to.be.ok;
            expect(res.author.name).to.eq(user.name);
            expect(res.author.id).to.equal(user.id);
            expect(res.author.email).to.equal(user.email);

            expect(res.versions).to.be.ok;
            expect(res.versions.length).to.equal(1);

            expect(res.versions[0]).to.be.ok;
            expect(res.versions[0].name).to.eq(data.versions[0].name);
            expect(res.versions[0].archive).to.not.eq(data.versions[0].archive);
            expect(res.versions[0].description).to.eq(data.versions[0].description);
          })
          .catch((err) => {
            console.error(err);
            chai.assert.fail(0, 1, err);
          });
      });

      it('should be able to create multiple versions', () => {
        const data: IPackageData = {
          name: 'asdf',
          author: user,
          versions: [
            {
              name: '1.1.0',
              archive: fileBase64,
              description: 'My description',
            },
            {
              name: '1.0.0',
              archive: fileBase64,
              description: 'My description',
            },
          ],
        };

        return ctrl.create(data)
          .then((res) => {
            expect(res).to.be.ok;

            expect(res.id).to.be.ok;
            expect(res.name).to.be.ok;
            expect(res.author).to.be.ok;

            expect(res.versions).to.be.ok;
            expect(res.versions.length).to.equal(2);

            expect(res.versions[0]).to.be.ok;
            expect(res.versions[0].name).to.eq(data.versions[0].name);
            expect(res.versions[0].archive).to.be.ok;
            expect(res.versions[0].description).to.eq(data.versions[0].description);

            expect(res.versions[1]).to.be.ok;
            expect(res.versions[1].name).to.eq(data.versions[1].name);
            expect(res.versions[1].archive).to.be.ok;
            expect(res.versions[1].description).to.eq(data.versions[1].description);
          })
          .catch((err) => {
            console.error(err);
            chai.assert.fail(0, 1, err);
          });
      });

      it('should delete all versions if package creation fails', (done) => {
        const data: IPackageData = {
          name: 'as@#@#$@#$@#df',
          author: user,
          versions: [
            {
              name: '1.0.0',
              archive: fileBase64,
              description: 'My description',
            },
          ],
        };

        ctrl.create(data)
          .then((res) => {
            chai.assert.fail(0, 1, res.toString());
          })
          .catch((err) => {
            app.db.models.PackageVersion.find({}, (err2, res) => {
              expect(res.length).to.eq(0);
              done();
            });
          });
      });

      it('should fail if a file is not provided', () => {
        const data: any = {
          name: 'asdf',
          author: user,
          versions: [
            {
              name: '1.0.0',
              description: 'My description',
            },
          ],
        };

        return ctrl.create(data)
          .then((res) => {
            chai.assert.fail(0, 1, res.toString());
          })
          .catch((err) => {
            expect(err).to.be.ok;
            expect(err.errors.archive.message).to.contain('Version archive is required');
          });
      });

      it('should fail if a version is not provided', () => {
        const data: any = {
          name: 'asdf',
          author: user,
          versions: [
            {
              archive: 'asdf',
              description: 'My description',
            },
          ],
        };

        return ctrl.create(data)
          .then((res) => {
            chai.assert.fail(0, 1, res.toString());
          })
          .catch((err) => {
            expect(err).to.be.ok;
            expect(err.errors.name.message).to.contain('Version name is required');
          });
      });
    });

    describe('get', () => {
      it('should retrieve a package by name', (done) => {
        ctrl.create({
          name: 'asdf',
          author: user.id,
          versions: [
            {
              name: '1.0.0',
              archive: 'asdf',
            },
          ],
        }).then((result) => {
          ctrl.get(result.name).then((record) => {
            expect(record).to.be.ok;
            expect(record.name).to.be.eq('asdf');
            done();
          });
        });
      });

      it('should return null if the package name does not exist', async () => {
        const getPromise = ctrl.get('asdf');
        const result = await getPromise;

        expect(result).to.be.not.ok;
      });
    });

    describe('httpGet', () => {
      it('should retrieve a package via url', async () => {
        const packId = 'asdf';
        const pack = await ctrl.create({
          name: packId,
          author: user.id,
          versions: [
            {
              name: '1.0.0',
              archive: 'asdf',
            },
          ],
        });

        await request(app.express)
          .get(`${routePackages}/${packId}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((result) => {
            const p: IModelPackage = result.body;

            expect(p).to.be.ok;
            expect(p.id).to.be.ok;
            expect(p.id).to.eq(pack.id);
            expect(p.name).to.eq(pack.name);

            expect(p.author).to.be.ok;
            expect(p.author.name).to.eq(user.name);
            expect(p.author.email).to.eq(user.email);
            expect(p.author.password).to.not.be.ok;
            expect(p.author.id).to.eq(user.id);

            expect(p.versions).to.be.ok;
            const v = p.versions[0];
            expect(v).to.be.ok;
            expect(v.name).to.be.eq(pack.versions[0].name);
            expect(v.archive).to.contain('file');
          });
      });

      it('should return packages from greatest version number to oldest', async () => {
        const packId = 'asdf';
        const pack = await ctrl.create({
          name: packId,
          author: user.id,
          versions: [
            {
              name: '1.0.0',
              archive: 'asdf',
            },
            {
              name: '1.1.0',
              archive: 'asdf',
            },
          ],
        });

        await request(app.express)
          .get(`${routePackages}/${packId}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((result) => {
            const p: IModelPackage = result.body;
            expect(p.versions).to.be.ok;

            const v = p.versions[0];
            expect(v).to.be.ok;
            expect(v.name).to.be.eq(pack.versions[1].name);

            const v2 = p.versions[1];
            expect(v2).to.be.ok;
            expect(v2.name).to.be.eq(pack.versions[0].name);
          });
      });

      it('should return an error if the lookup fails', (done) => {
        const packId = 'fdsa';
        request(app.express)
          .get(`${routePackages}/${packId}`)
          .expect('Content-Type', /json/)
          .expect(400)
          .end((err, response) => {
            expect(err).to.not.be.ok;
            expect(response.body).to.be.ok;
            expect(response.body.message).to.contain(`Could not find the requested package ID ${packId}`);

            done();
          });
      });
    });
  });
});
