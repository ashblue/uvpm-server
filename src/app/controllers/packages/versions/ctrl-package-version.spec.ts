import { Database } from '../../databases/database';
import * as async from 'async';
import * as chai from 'chai';
import { CtrlPackageVersion } from './ctrl-package-version';
import { fileHelper } from '../../../helpers/file-helper';
import { IPackageVersionData } from '../../../models/package/version/i-package-version-data';
import { CtrlPackage } from '../ctrl-package';
import { IPackageData } from '../../../models/package/i-package-data';
import { IModelUser } from '../../../models/user/i-model-user';
import { App } from '../../../app';
const expect = chai.expect;
import request = require('supertest');
import { IModelPackageVersion } from '../../../models/package/version/i-model-package-version';
import { UserHelpers, userHelpers } from '../../../helpers/user-helpers';
import { existsSync } from 'fs';
import * as sinon from 'sinon';

describe('CtrlPackageVersion', () => {
  let app: App;
  let db: Database;

  beforeEach((done) => {
    app = new App();
    app.db.connection.once('connected', () => {
      db = app.db;
      db.connection.db.dropDatabase().then(() => {
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
    const ctrl = new CtrlPackageVersion(db);

    expect(ctrl).to.be.ok;
  });

  describe('when initialized', () => {
    let ctrlVersion: CtrlPackageVersion;
    let ctrlPackage: CtrlPackage;
    let fileBase64: string;
    let user: IModelUser;
    let token: string;
    let adminToken: string;

    beforeEach(async () => {
      adminToken = await UserHelpers.getTokenFromApp(app, 'admin');
    });

    beforeEach((done) => {
      ctrlPackage = new CtrlPackage(db);
      ctrlVersion = ctrlPackage.versions;
      expect(ctrlVersion).to.be.ok;

      async.parallel([
        (callback) => {
          fileHelper.createBase64File(1, (base64) => {
            fileBase64 = base64;
            callback();
          });
        },
        (callback) => {
          const userDetails = {
            name: 'asdf',
            email: 'asdf@asdf.com',
            password: 'asdfasdf1',
          };

          request(app.express)
            .post('/api/v1/users')
            .set('Authorization', `Bearer ${adminToken}`)
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

    describe('create', () => {
      it('should create a new name object', (done) => {
        ctrlVersion.create({
          name: '0.0.0',
          archive: fileBase64,
        }, (err, result) => {
          expect(err).to.be.not.ok;
          expect(result).to.be.ok;

          if (result) {
            expect(result.name).to.eq('0.0.0');
            expect(result.archive).to.be.ok;
          }

          done();
        });
      });

      it('should error if invalid data is provided', (done) => {
        ctrlVersion.create({
          name: '',
          archive: fileBase64,
        }, (err) => {
          expect(err).to.be.ok;
          if (err) {
            expect(err.message).to.contain('Version name is required');
          }

          done();
        });
      });
    });

    describe('sanitize', () => {
      it('should return a cleaned version', () => {
        const version: IPackageVersionData = {
            name: '0.0.0',
            archive: 'archive',
        };

        const cleaned = ctrlVersion.sanitize(version);

        expect(cleaned.name).eq(version.name);
        expect(cleaned.archive).eq(version.archive);
        expect(cleaned.description).to.not.be.ok;
      });

      it('should return empty if argument is null', () => {
        const v: any = null;
        const result = ctrlVersion.sanitize(v);

        expect(v).to.eq(result);
      });
    });

    describe('sanitizeMany', () => {
      it('should return an array of sanitized versions', () => {
        const versions: IPackageVersionData[] = [
          {
            name: '0.0.0',
            archive: 'archive',
            description: 'description',
          },
          {
            name: '1.0.0',
            archive: 'asdf',
            description: 'asdf',
          },
        ];

        const cleaned = ctrlVersion.sanitizeMany(versions);

        expect(cleaned.length).eq(2);
        expect(cleaned[0].name).eq('0.0.0');
        expect(cleaned[0].archive).eq('archive');
        expect(cleaned[0].description).eq('description');
      });

      it('should not inject an empty description', () => {
        const versions: IPackageVersionData[] = [
          {
            name: '0.0.0',
            archive: 'archive',
          },
        ];

        const cleaned = ctrlVersion.sanitizeMany(versions);

        expect(cleaned[0]).to.not.haveOwnProperty('description');
      });

      it('should return an empty array on an empty argument', () => {
        const versions: any = null;

        const cleaned = ctrlVersion.sanitizeMany(versions);

        expect(cleaned).to.be.ok;
        expect(cleaned.length).eq(0);
      });

      it('should remove undefined and null array elements', () => {
        const empty: any = null;
        const emptyB: any = undefined;

        const versions: IPackageVersionData[] = [
          {
            name: '0.0.0',
            archive: 'archive',
            description: 'description',
          },
          empty,
          emptyB,
        ];

        const cleaned = ctrlVersion.sanitizeMany(versions);

        expect(cleaned.length).eq(1);
        expect(cleaned[0].name).eq('0.0.0');
        expect(cleaned[0].archive).eq('archive');
        expect(cleaned[0].description).eq('description');
      });

      it('should convert object properties to corresponding types', () => {
        const num: any = 12345;
        const str: string = num.toString();

        const versions: IPackageVersionData[] = [
          {
            name: num,
            archive: num,
            description: num,
          },
        ];

        const cleaned = ctrlVersion.sanitizeMany(versions);

        expect(cleaned.length).eq(1);
        expect(cleaned[0].name).eq(str);
        expect(cleaned[0].archive).eq(str);
        expect(cleaned[0].description).eq(str);
      });
    });

    describe('createMany', () => {
      it('should convert an array of objects to package version models with id', (done) => {
        const versions: IPackageVersionData[] = [
          {
            name: '0.0.0',
            archive: 'archive',
            description: 'description',
          },
          {
            name: '1.0.0',
            archive: 'asdf',
          },
        ];

        const promise = ctrlVersion.createMany(versions);
        promise.then((savedVersions) => {
          expect(savedVersions.length).eq(2);

          expect(savedVersions[0].name).eq('0.0.0');
          expect(savedVersions[0].archive).to.not.eq('archive');
          expect(savedVersions[0].description).eq('description');
          expect(savedVersions[0]._id).to.be.ok;

          expect(savedVersions[1].name).eq('1.0.0');
          expect(savedVersions[1].archive).to.not.eq('asdf');
          expect(savedVersions[1].description).to.not.be.ok;
          expect(savedVersions[1]._id).to.be.ok;

          done();
        });
      });
    });

    describe('get', () => {
      it('should get a version based upon package name and version number', async () => {
        const versionData: IPackageVersionData = {
          name: '0.0.0-a',
          archive: 'asdf',
        };

        const packData: IPackageData = {
          name: 'package',
          versions: [versionData],
          author: user.id,
        };

        const pack = await ctrlPackage.create(packData);
        const ver = await ctrlVersion.get(packData.name, versionData.name);

        expect(ver).to.be.ok;
        expect(ver.id).to.eq(pack.versions[0].id);
      });

      it('should return an error message if the package does not exist', async () => {
        const packageName = 'asdf';

        try {
          const result = await ctrlVersion.get('asdf', 'asdf');
          expect(result).to.not.be.ok;
        } catch (err) {
          expect(err).to.be.ok;
          expect(err.message).to.contain(`Package ${packageName} could not be found`);
        }
      });

      it('should return error message if the version does not exist', async () => {
        const versionName = '0.0.0';

        const versionData: IPackageVersionData = {
          name: '0.0.0-a',
          archive: 'asdf',
        };

        const packData: IPackageData = {
          name: 'package',
          versions: [versionData],
          author: user.id,
        };

        await ctrlPackage.create(packData);

        try {
          const result = await ctrlVersion.get(packData.name, versionName);
          expect(result).to.not.be.ok;
        } catch (err) {
          expect(err).to.be.ok;
          expect(err.message).to.contain(`Package ${packData.name} does not have version ${versionName}`);
        }
      });
    });

    describe('httpGet', () => {
      beforeEach(() => {
        app.express.get(`/packages/:idPackage/versions/:idVersion`, (req, res) => {
          ctrlVersion.httpGet(req, res);
        });
      });

      it('should get a version via url `packages/ID/versions/ID`', async () => {
        const packId = 'asdf';
        const verId = '0.0.0';
        const pack = await ctrlPackage.create({
          name: packId,
          author: user.id,
          versions: [
            {
              name: verId,
              archive: 'asdf',
            },
          ],
        });

        const ver = pack.versions[0];

        await request(app.express)
          .get(`/packages/${packId}/versions/${verId}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((result) => {
            const v: IModelPackageVersion = result.body;

            expect(v).to.be.ok;
            expect(v.id).to.be.ok;
            expect(v.id).to.eq(ver.id);
            expect(v.name).to.eq(ver.name);
            expect(v.archive).to.be.ok;
          });
      });

      it('should error if the package does not exist', async () => {
        const packId = 'asdf';
        const verId = '1.0.0';
        await ctrlPackage.create({
          name: 'fdas',
          author: user.id,
          versions: [
            {
              name: verId,
              archive: 'asdf',
            },
          ],
        });

        await request(app.express)
          .get(`/packages/${packId}/versions/${verId}`)
          .expect('Content-Type', /json/)
          .expect(400)
          .then((result) => {
            const v: {message: string} = result.body;

            expect(v).to.be.ok;
            expect(v.message).to.be.ok;
            expect(v.message).to.eq(`Package ${packId} could not be found`);
          });
      });

      it('should error if the version does not exist', async () => {
        const packId = 'asdf';
        const verId = '1.0.0';
        await ctrlPackage.create({
          name: packId,
          author: user.id,
          versions: [
            {
              name: '0.0.0',
              archive: 'asdf',
            },
          ],
        });

        await request(app.express)
          .get(`/packages/${packId}/versions/${verId}`)
          .expect('Content-Type', /json/)
          .expect(400)
          .then((result) => {
            const v: {message: string} = result.body;

            expect(v).to.be.ok;
            expect(v.message).to.be.ok;
            expect(v.message).to.eq(`Package ${packId} does not have version ${verId}`);
          });
      });
    });

    describe('httpAdd', () => {
      beforeEach(() => {
        app.express.post(`/packages/:idPackage/versions`, (req, res, next) => {
          app.routes.v1.users.ctrlUser.authenticate(req, res, next, () => {
            ctrlVersion.httpAdd(req, res);
          });
        });
      });

      it('should add a version to a package', async () => {
        const pack = await ctrlPackage.create({
          name: 'my-pack',
          author: user.id,
          versions: [
            {
              name: '0.0.0',
              archive: 'asdf',
            },
          ],
        });

        const packNew: IPackageVersionData = {
          name: '1.0.0',
          archive: 'asdf',
        };

        await request(app.express)
          .post(`/packages/${pack.name}/versions`)
          .send(packNew)
          .set('Authorization', token)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((result) => {
            const v: IModelPackageVersion = result.body;

            expect(v).to.be.ok;
            expect(v.id).to.be.ok;
            expect(v.name).to.eq(packNew.name);
            expect(v.archive).to.be.ok;
          });
      });

      it('should error if the package ID does not exist', async () => {
        const packName = 'pack-name';
        const packNew: IPackageVersionData = {
          name: '1.0.0',
          archive: 'asdf',
        };

        await request(app.express)
          .post(`/packages/${packName}/versions`)
          .send(packNew)
          .set('Authorization', token)
          .expect('Content-Type', /json/)
          .expect(400)
          .then((result) => {
            const v: {message: string} = result.body;

            expect(v).to.be.ok;
            expect(v.message).to.contain(packName);
          });
      });

      it('should error if the user is not authenticated', async () => {
        const pack = await ctrlPackage.create({
          name: 'my-pack',
          author: user.id,
          versions: [
            {
              name: '0.0.0',
              archive: 'asdf',
            },
          ],
        });

        const packNew: IPackageVersionData = {
          name: '1.0.0',
          archive: 'asdf',
        };

        await request(app.express)
          .post(`/packages/${pack.name}/versions`)
          .send(packNew)
          .expect('Content-Type', /json/)
          .expect(401)
          .then((result) => {
            const v: {message: string} = result.body;

            expect(v).to.be.ok;
            expect(v.message).to.be.ok;
            expect(v.message).to.contain('Authentication failed');
          });
      });

      it('should not allow someone other than the package author to add a version', async () => {
        const pack = await ctrlPackage.create({
          name: 'my-pack',
          author: user.id,
          versions: [
            {
              name: '0.0.0',
              archive: 'asdf',
            },
          ],
        });

        const newUser = await userHelpers.createUser(app, 'joe', 'jow@gmail.com', 'asdfasdf1');

        const packNew: IPackageVersionData = {
          name: '1.0.0',
          archive: 'asdf',
        };

        await request(app.express)
          .post(`/packages/${pack.name}/versions`)
          .send(packNew)
          .set('Authorization', `Bearer ${newUser.token}`)
          .expect('Content-Type', /json/)
          .expect(400)
          .then((result) => {
            const v: { message: string } = result.body;

            expect(v).to.be.ok;
            expect(v.message).to.be.ok;
            expect(v.message).to.eq('You are not authorized to do that');
          });
      });
    });

    describe('add', () => {
      it('should add a new version to an existing package', async () => {
        const versionData: IPackageVersionData = {
          name: '0.0.0',
          archive: 'asdf',
        };

        const versionAltData: IPackageVersionData = {
          name: '1.0.0',
          archive: 'asdf',
        };

        const packData: IPackageData = {
          name: 'my-pack-single-ver',
          author: user.id,
          versions: [versionData],
        };

        const pack = await ctrlPackage.create(packData);
        const versionAlt = await ctrlVersion.add(pack.name, versionAltData);
        expect(versionAlt).to.be.ok;

        const packUpdate = await ctrlPackage.get(pack.name);
        expect(packUpdate).to.be.ok;
        expect(packUpdate.id).to.eq(pack.id);
        expect(packUpdate.versions.length).to.eq(2);

        const versionAltCopy = packUpdate.versions.find((v) => v.name === versionAltData.name);
        expect(versionAltCopy).to.be.ok;
        if (versionAltCopy) {
          expect(versionAltCopy.id).to.eq(versionAlt.id);
        }
      });

      it('should fail if the package does not exist', async () => {
        const versionData: IPackageVersionData = {
          name: '0.0.0',
          archive: 'asdf',
        };

        const packData: IPackageData = {
          name: 'my-pack-single-ver',
          author: user.id,
          versions: [versionData],
        };

        let err;
        try {
          await ctrlVersion.add(packData.name, versionData);
        } catch (e) {
          err = e;
        }

        expect(err).to.be.ok;
        expect(err).to.eq(`Package ${packData.name} could not be found`);

        const version = await db.models.PackageVersion.findOne({
          name: versionData.name,
        });

        expect(version).to.not.be.ok;
      });

      it('should fail if the version data is incomplete', async () => {
        const versionData: IPackageVersionData = {
          name: '0.0.0',
          archive: 'asdf',
        };

        const versionAltData: any = {
          name: 'asdf',
        };

        const packData: IPackageData = {
          name: 'my-pack-single-ver',
          author: user.id,
          versions: [versionData],
        };

        const pack = await ctrlPackage.create(packData);

        let err: any;
        try {
          await ctrlVersion.add(pack.name, versionAltData);
        } catch (e) {
          err = e;
        }

        expect(err).to.be.ok;
        expect(err.errors.name.message).to.contain('Version name only supports');

        const version = await db.models.PackageVersion.findOne({
          name: versionAltData.name,
        });

        expect(version).to.not.be.ok;
      });

      it('should fail if the version number already exists on the model', async () => {
        const versionData: IPackageVersionData = {
          name: '0.0.0',
          archive: 'asdf',
        };

        const versionAltData: IPackageVersionData = {
          name: '0.0.0',
          archive: 'asdf',
        };

        const packData: IPackageData = {
          name: 'my-pack-single-ver',
          author: user.id,
          versions: [versionData],
        };

        const pack = await ctrlPackage.create(packData);

        let err: any;
        try {
          await ctrlVersion.add(pack.name, versionAltData);
        } catch (e) {
          err = e;
        }

        expect(err).to.be.ok;
        expect(err.errors.versions.message).to.contain('unique name');

        const versions = await db.models.PackageVersion.find({
          name: versionAltData.name,
        });

        expect(versions.length).to.eq(1);
      });
    });

    describe('destroy', () => {
      it('should delete a package version with a package ID and version ID', async () => {
        const pack = await ctrlPackage.create({
          name: 'my-pack',
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

        const ver1 = pack.versions[1];
        await ctrlVersion.destroy(pack.name, ver1.name);

        const version = await db.models.PackageVersion.findById(ver1.id);
        expect(version).to.not.be.ok;
        expect(existsSync(ver1.archive)).to.not.be.ok;

        const packUpdate = await ctrlPackage.get(pack.name);
        expect(packUpdate).to.be.ok;
        expect(packUpdate.versions.length).to.eq(1);
        expect(packUpdate.versions[0].id).to.eq(pack.versions[0].id);
      });

      it('should catch the error if finding the package fails', async () => {
        const errMsg = 'Failed to find package';
        const stub = sinon.stub(app.db.models.Package, 'findOne');
        stub.callsFake(() => {
          return new Promise((resolve, reject) => {
            reject(errMsg);
          });
        });

        let err: string|null = null;
        try {
          await ctrlVersion.destroy('asdf', 'fdaa');
        } catch (e) {
          err = e;
        }

        expect(err).to.be.ok;
        expect(err).to.eq(errMsg);

        stub.restore();
      });

      it('should fail if the package does not exist', async () => {
        let e: any;

        const pack = await ctrlPackage.create({
          name: 'my-pack',
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

        try {
          await ctrlVersion.destroy('asdf', pack.versions[0].name);
        } catch (err) {
          e = err;
        }

        const version = await db.models.PackageVersion.findById(pack.versions[0].id);

        expect(e).to.be.ok;
        expect(e.message).to.be.ok;
        expect(e.message).to.contain(`Package asdf could not be found`);

        expect(version).to.be.ok;
      });

      it('should fail if the package version is missing', async () => {
        let e: any;

        const pack = await ctrlPackage.create({
          name: 'my-pack',
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

        try {
          await ctrlVersion.destroy(pack.name, 'asdf');
        } catch (err) {
          e = err;
        }

        expect(e).to.be.ok;
        expect(e.message).to.be.ok;
        expect(e.message).to.contain(`Package ${pack.name} does not have version asdf`);
      });

      it('should fail if this is the last version on a package', async () => {
        let e: any;

        const pack = await ctrlPackage.create({
          name: 'my-pack',
          author: user.id,
          versions: [
            {
              name: '0.0.0',
              archive: 'asdf',
            },
          ],
        });

        try {
          await ctrlVersion.destroy(pack.name, pack.versions[0].name);
        } catch (err) {
          e = err;
        }

        const version = await db.models.PackageVersion.findById(pack.versions[0].id);

        expect(e).to.be.ok;
        expect(e).to.contain(`You cannot remove the last version on a package`);

        expect(version).to.be.ok;
      });

      it('should fail if the package version is not on the requested package', async () => {
        let e: any;

        const pack = await ctrlPackage.create({
          name: 'my-pack',
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

        const packAlt = await ctrlPackage.create({
          name: 'my-pack-alt',
          author: user.id,
          versions: [
            {
              name: '4.0.0',
              archive: 'asdf',
            },
            {
              name: '5.0.0',
              archive: 'asdf',
            },
          ],
        });

        try {
          await ctrlVersion.destroy(pack.name, packAlt.versions[0].name);
        } catch (err) {
          e = err;
        }

        const version = await db.models.PackageVersion.findById(packAlt.versions[0].id);

        expect(e).to.be.ok;
        expect(e.message).to.be.ok;
        expect(e.message).to.contain(
          `Package ${pack.name} does not have version ${packAlt.versions[0].name}`);

        expect(version).to.be.ok;
      });
    });

    describe('httpDestroy', () => {
      beforeEach(() => {
        app.express.delete(`/packages/:idPackage/versions/:idVersion`, (req, res, next) => {
          app.routes.v1.users.ctrlUser.authenticate(req, res, next, () => {
            ctrlVersion.httpDestroy(req, res);
          });
        });
      });

      it('should destroy a version', async () => {
        const pack = await ctrlPackage.create({
          name: 'my-pack',
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

        const version = pack.versions[1];

        await request(app.express)
          .del(`/packages/${pack.name}/versions/${version.name}`)
          .set('Authorization', token)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body).to.be.ok;
            expect(res.body.message).to.be.ok;

            const message = res.body.message;
            expect(message).to.contain('Package removed');
          });

        const versionUpdate = await db.models.PackageVersion.findById(version.id);
        expect(versionUpdate).to.not.be.ok;
      });

      it('should fail if a user is not provided', async () => {
        const pack = await ctrlPackage.create({
          name: 'my-pack',
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

        const version = pack.versions[1];

        await request(app.express)
          .del(`/packages/${pack.name}/versions/${version.name}`)
          .expect('Content-Type', /json/)
          .expect(401)
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body).to.be.ok;
            expect(res.body.message).to.be.ok;

            const message = res.body.message;
            expect(message).to.contain('Authentication failed');
          });

        const versionUpdate = await db.models.PackageVersion.findById(version.id);
        expect(versionUpdate).to.be.ok;
      });

      it('should fail if the user is not the package author', async () => {
        const userAlt = await userHelpers.createUser(app, 'Roger', 'roger@gmail.com', 'asdf12341');

        const pack = await ctrlPackage.create({
          name: 'my-pack',
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

        const version = pack.versions[1];

        await request(app.express)
          .del(`/packages/${pack.name}/versions/${version.name}`)
          .set('Authorization', `Bearer ${userAlt.token}`)
          .expect('Content-Type', /json/)
          .expect(400)
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body).to.be.ok;
            expect(res.body.message).to.be.ok;

            const message = res.body.message;
            expect(message).to.contain('You are not the package author');
          });

        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });

        const versionUpdate = await db.models.PackageVersion.findById(version.id);
        expect(versionUpdate).to.be.ok;
      });

      it('should return an error if deletion fails', async () => {
        const pack = await ctrlPackage.create({
          name: 'my-pack',
          author: user.id,
          versions: [
            {
              name: '0.0.0',
              archive: 'asdf',
            },
          ],
        });

        const version = pack.versions[0];

        await request(app.express)
          .del(`/packages/${pack.name}/versions/${version.name}`)
          .set('Authorization', token)
          .expect('Content-Type', /json/)
          .expect(400)
          .then((res) => {
            expect(res).to.be.ok;
            expect(res.body).to.be.ok;
            expect(res.body.message).to.be.ok;

            const message = res.body.message;
            expect(message).to.contain('You cannot remove the last version on a package');
          });

        const versionUpdate = await db.models.PackageVersion.findById(version.id);
        expect(versionUpdate).to.be.ok;
      });

      xit('should allow all authenticated users to delete their own package versions');

      xit('should allow admins to delete package versions they do not own');

      xit('should not allow authenticated users except admins to delete other people\'s packages');
    });
  });
});
