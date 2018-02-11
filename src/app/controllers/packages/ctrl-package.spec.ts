import { CtrlPackage } from './ctrl-package';
import request = require('supertest');
import * as chai from 'chai';
import { IModelUser } from '../../models/user/i-model-user';
import { App } from '../../app';
import * as async from 'async';
import { fileHelper } from '../../helpers/file-helper';
import { IPackageData } from '../../models/package/i-package-data';
import { IModelPackage } from '../../models/package/i-model-package';
import { IPackageSearchResult } from '../../models/package/i-package-search-result';
import * as fs from 'fs';
import { userHelpers } from '../../helpers/user-helpers';
import { esHelpers } from '../../helpers/es-helpers';
import * as sinon from 'sinon';

const expect = chai.expect;

describe('CtrlPackage', () => {
  let app: App;

  beforeEach((done) => {
    app = new App();
    app.db.connection.once('connected', () => {
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
    const routeSearch = `${routePackages}/search`;

    let ctrl: CtrlPackage;
    let user: IModelUser;
    let token: string;
    let fileBase64: string;

    beforeEach((done) => {
      ctrl = new CtrlPackage(app.db);

      app.express.post(routePackages, (req, res, next) => {
        app.routes.v1.users.ctrlUser.authenticate(req, res, next, () => {
          ctrl.httpCreate(req, res);
        });
      });

      app.express.get(`${routePackages}/:idPackage`, (req, res) => {
        ctrl.httpGet(req, res);
      });

      app.express.delete(`${routePackages}/:idPackage`, (req, res, next) => {
        app.routes.v1.users.ctrlUser.authenticate(req, res, next, () => {
          ctrl.httpDestroy(req, res);
        });
      });

      app.express.get(`${routeSearch}/:packageName`, (req, res) => {
        ctrl.httpSearch(req, res);
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

    describe('httpCreate', () => {
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

      it('should return an error if package creation fails', async () => {
        const errMessage = 'Failed to create package';
        const stub = sinon.stub(ctrl, 'create');
        stub.callsFake(() => {
          return new Promise((resolve, reject) => {
            reject(errMessage);
          });
        });

        await request(app.express)
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
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body).to.eq(errMessage);
          });

        stub.restore();
      });

      it('should return an error if package lookup fails', async () => {
        const errMessage = 'Model does not exist';
        const stub = sinon.stub(app.db.models.Package, 'findOne');
        stub.callsFake((data, callback) => {
          callback(errMessage);
        });

        await request(app.express)
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
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body).to.eq(errMessage);
          });

        stub.restore();
      });

      it('should fail if no user is provided', async () => {
        await request(app.express)
          .post(routePackages)
          .send({
            name: 'asdf',
            versions: [{
              name: '1.0.0',
              archive: 'asdf',
              description: 'My description',
            }],
          })
          .expect('Content-Type', /json/)
          .expect(401)
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body.message).to.eq('Authentication failed');
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

      it('should return an error if get fails', async () => {
        const errMessage = 'Get failed lookup';
        const stub = sinon.stub(ctrl, 'get');
        stub.callsFake(() => {
          return new Promise((resolve, reject) => {
            reject(errMessage);
          });
        });

        const packId = 'fdsa';
        await request(app.express)
          .get(`${routePackages}/${packId}`)
          .expect('Content-Type', /json/)
          .expect(400)
          .then((response) => {
            expect(response).to.be.ok;
            expect(response.body).to.be.ok;
            expect(response.body).to.contain(errMessage);
            stub.restore();
          });
      });
    });

    describe('destroy', () => {
      it('should remove the package, all associated versions, and version files', async () => {
        const pack = await ctrl.create({
          name: 'my-package',
          author: user.id,
          versions: [
            {
              name: '0.0.0',
              archive: 'asdf',
            },
            {
              name: '1.0.0',
              archive: 'asdf',
            },
          ],
        });

        await ctrl.destroy(pack.name);

        // Verify everything has been properly destroyed
        await new Promise((resolve) => {
          async.parallel([
            (callback) => {
              app.db.models.Package.findById(pack.id, (err, res: any) => {
                callback(err, res);
              });
            },
            (callback) => {
              app.db.models.PackageVersion.find({
                _id: {
                  $in: pack.versions.map((v) => v.id),
                },
              }, (err, res: any) => {
                callback(err, res);
              });
            },
            (callback) => {
              const files = pack.versions.map((v) => v.archive);
              for (const f in files) {
                if (fs.existsSync(f)) {
                  callback(`File ${f} should not exist`, undefined);
                  return;
                }
              }

              callback(undefined, undefined);
            },
          ], (err, results) => {
            expect(err).to.be.not.ok;

            // Everything should be empty, results means data did not clean up correctly
            if (results) {
              results.forEach((r) => {
                if (Array.isArray(r)) {
                  r.forEach((a) => {
                    expect(a).to.be.not.ok;
                  });

                  return;
                }

                expect(r).to.not.be.ok;
              });
            }

            resolve();
          });
        });
      });

      it('should fail if the package does not exist', async () => {
        const name = 'non existent name';
        let err: any;

        try {
          await ctrl.destroy(name);
        } catch (e) {
          err = e;
        }

        expect(err).to.be.ok;
        expect(err.message).to.contain(`Could not find package ID ${name}`);
      });
    });

    describe('httpDestroy', () => {
      let pack: IModelPackage;

      beforeEach( (done) => {
        ctrl.create({
          name: 'my-package',
          author: user.id,
          versions: [
            {
              name: '0.0.0',
              archive: 'asdf',
            },
            {
              name: '1.0.0',
              archive: 'asdf',
            },
          ],
        }).then((p) => {
          pack = p;
          done();
        });
      });

      it('should allow the author to remove the package', async () => {
        await request(app.express)
          .del(`${routePackages}/${pack.name}`)
          .set('Authorization', token)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            expect(res).to.be.ok;
          });
      });

      it('should catch a destroy error', async () => {
        const errMessage = 'Destroy failed';
        const stub = sinon.stub(ctrl, 'destroy');
        stub.callsFake(() => {
          return new Promise((resolve, reject) => {
            reject(errMessage);
          });
        });

        await request(app.express)
          .del(`${routePackages}/${pack.name}`)
          .set('Authorization', token)
          .expect('Content-Type', /json/)
          .expect(400)
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body).to.eq(errMessage);
          });

        stub.restore();
      });

      it('should return an error message if the package cannot be found', async () => {
        const fakePackName = 'NON_EXISTENT_ID';

        await request(app.express)
          .del(`${routePackages}/${fakePackName}`)
          .set('Authorization', token)
          .expect('Content-Type', /json/)
          .expect(400)
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body).to.be.ok;
            expect(res.body.message).to.be.ok;
            expect(res.body.message).to.eq(`Could not find package ID ${fakePackName}`);
          });
      });

      it('should not allow an anonymous user to delete a package', async () => {
        await request(app.express)
          .del(`${routePackages}/${pack.name}`)
          .expect('Content-Type', /json/)
          .expect(401)
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body).to.be.ok;
            expect(res.body.message).to.be.ok;
            expect(res.body.message).to.eq('Authentication failed');
          });
      });

      it('should not allow a user other than the author to delete a package', async () => {
        const userAlt = await userHelpers.createUser(app, 'new user', 'dkjfdkjfdkj@adsf.com', '12345asdf');

        await request(app.express)
          .del(`${routePackages}/${pack.name}`)
          .set('Authorization', `Bearer ${userAlt.token}`)
          .expect('Content-Type', /json/)
          .expect(401)
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body).to.be.ok;
            expect(res.body.message).to.be.ok;
            expect(res.body.message).to.eq(`You cannot delete this package`);
          });
      });
    });

    describe('search', () => {
      it('should return a list of packages', async () => {
        const pack1 = await ctrl.create({
          name: 'unity-animation-library',
          author: user.id,
          versions: [
            {
              name: '1.0.0',
              archive: 'asdf',
            },
          ],
        });

        const pack2 = await ctrl.create({
          name: 'unity-helpers',
          author: user.id,
          versions: [
            {
              name: '1.0.0',
              archive: 'asdf',
              description: 'my description',
            },
            {
              name: '3.0.0',
              archive: 'asdf',
              description: 'my description',
            },
            {
              name: '2.0.0',
              archive: 'asdf',
              description: 'my description',
            },
          ],
        });

        const pack3 = await ctrl.create({
          name: 'unity-toolkit',
          author: user.id,
          versions: [
            {
              name: '1.0.0',
              archive: 'asdf',
            },
          ],
        });

        esHelpers.setSearchResults(app.db.models.Package, undefined, {
          took: 0,
          hits: {
            total: 3,
            max_score: 5,
            hits: [
              {
                _index: '0',
                _type: 'Package',
                _id: 'asdf',
                _score: 3,
                _source: {
                  name: pack2.name,
                },
              },
              {
                _index: '0',
                _type: 'Package',
                _id: 'asdf',
                _score: 1,
                _source: {
                  name: pack1.name,
                },
              },
              {
                _index: '0',
                _type: 'Package',
                _id: 'asdf',
                _score: 1,
                _source: {
                  name: pack3.name,
                },
              },
            ],
          },
        });

        const results = await ctrl.search(pack2.name);

        expect(results).to.be.ok;
        expect(results.length).eq(3);
        expect(results[0].name).eq(pack2.name);
        expect(results[0].description).eq(pack2.versions[1].description);
        expect(results[0].author).eq(pack2.author.name);
        expect(results[0].version).eq(pack2.versions[1].name);
        expect(results[0].date.getTime()).eq(pack2.versions[1].createdAt.getTime());
      });

      it('should return an error if no packages are found', async () => {
        let err: any;
        const errMsg = 'Failed to find package';

        esHelpers.setSearchResults(app.db.models.Package, errMsg);

        try {
          await ctrl.search('unity-helpers');
        } catch (e) {
          err = e;
        }

        expect(err).to.be.ok;
        expect(err).to.eq(errMsg);
      });
    });

    describe('httpSearch', () => {
      it('should return search results', async () => {
        const pack1 = await ctrl.create({
          name: 'unity-animation-library',
          author: user.id,
          versions: [
            {
              name: '1.0.0',
              archive: 'asdf',
            },
          ],
        });

        const pack2 = await ctrl.create({
          name: 'unity-helpers',
          author: user.id,
          versions: [
            {
              name: '1.0.0',
              archive: 'asdf',
              description: 'my description',
            },
            {
              name: '3.0.0',
              archive: 'asdf',
              description: 'my description',
            },
            {
              name: '2.0.0',
              archive: 'asdf',
              description: 'my description',
            },
          ],
        });

        const pack3 = await ctrl.create({
          name: 'unity-toolkit',
          author: user.id,
          versions: [
            {
              name: '1.0.0',
              archive: 'asdf',
            },
          ],
        });

        esHelpers.setSearchResults(app.db.models.Package, undefined, {
          took: 0,
          hits: {
            total: 3,
            max_score: 5,
            hits: [
              {
                _index: '0',
                _type: 'Package',
                _id: 'asdf',
                _score: 3,
                _source: {
                  name: pack2.name,
                },
              },
              {
                _index: '0',
                _type: 'Package',
                _id: 'asdf',
                _score: 1,
                _source: {
                  name: pack1.name,
                },
              },
              {
                _index: '0',
                _type: 'Package',
                _id: 'asdf',
                _score: 1,
                _source: {
                  name: pack3.name,
                },
              },
            ],
          },
        });

        await request(app.express)
          .get(`${routeSearch}/unity-helpers`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((result) => {
            const ps: IPackageSearchResult[] = result.body;
            expect(ps).to.be.ok;
            expect(ps.length).to.eq(3);

            const r = ps[0];
            expect(r).to.be.ok;
            expect(r.name).eq(pack2.name);
            expect(r.description).eq(pack2.versions[1].description);
            expect(r.author).eq(pack2.author.name);
            expect(r.version).eq(pack2.versions[1].name);
            expect(r.date).to.be.ok;
          });
      });

      it('should return an empty array if search is empty', async () => {
        const stub = sinon.stub(ctrl, 'search');
        stub.callsFake(() => {
          return new Promise((resolve) => {
            resolve(undefined);
          });
        });

        await request(app.express)
          .get(`${routeSearch}/unity-helpers`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body).to.be.ok;
            expect(res.body.length).to.eq(0);
          });

        stub.restore();
      });

      it('should return an empty array if the search fails', async () => {
        const errMsg = 'Failed to find package';
        esHelpers.setSearchResults(app.db.models.Package, errMsg);

        await request(app.express)
          .get(`${routeSearch}/unity-help`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((result) => {
            const ps: IPackageSearchResult[] = result.body;
            expect(ps).to.be.ok;
            expect(ps.length).to.eq(0);
          });
      });
    });
  });
});
