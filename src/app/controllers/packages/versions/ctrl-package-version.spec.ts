import { Database } from '../../databases/database';
import { CtrlUser } from '../../users/ctrl-user';
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

describe('CtrlPackageVersion', () => {
  let app: App;
  let db: Database;

  beforeEach((done) => {
    app = new App();
    app.db.connection.once('open', () => {
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
    const ctrl = new CtrlUser(db);

    expect(ctrl).to.be.ok;
  });

  describe('when initialized', () => {
    let ctrlVersion: CtrlPackageVersion;
    let ctrlPackage: CtrlPackage;
    let fileBase64: string;
    let user: IModelUser;
    // let token: string;

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

                  // token = `Bearer ${res2.body.token}`;
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

      xit('should fail if the package does not exist', () => {
        console.log('placeholder');
      });

      xit('should fail if the version data is incomplete', () => {
        console.log('placeholder');
      });

      xit('should fail if the version number already exists on the model', () => {
        console.log('placeholder');
      });
    });
  });
});
