import { App } from '../../../../../app';
import request = require('supertest');
import { UserHelpers } from '../../../../../helpers/user-helpers';
import uuidv4 = require('uuid/v4');

import * as chai from 'chai';
import { IUserLogin } from '../../../../../models/user/i-user-login';
import { IPackageData } from '../../../../../models/package/i-package-data';
import { IModelPackage } from '../../../../../models/package/i-model-package';
import { IModelPackageVersion } from '../../../../../models/package/version/i-model-package-version';
import { CtrlUserRoles } from '../../../../../controllers/user-roles/ctrl-user-roles';
import { IUserPermissions } from '../../../../../controllers/user-roles/i-user-permissions';
const expect = chai.expect;

describe('RoutePackageVersions', () => {
  let app: App;
  let user: IUserLogin;

  beforeEach((done) => {
    app = new App();
    app.db.connection.once('connected', () => {
      app.db.connection.db.dropDatabase().then(() => {
        done();
      });
    });
  });

  beforeEach(async () => {
    user = await UserHelpers.createUserDetails(app, 'Roger', 'roger@gmail.com', 'asdf1234a');
  });

  afterEach((done) => {
    app.db.closeConnection(done);
  });

  it('should initialize', () => {
    expect(app.routes.v1.packageVersions).to.be.ok;
  });

  describe('after creating a new package', () => {
    let pack: IModelPackage;
    let packData: IPackageData;

    beforeEach(async () => {
      packData = {
        name: 'my-package',
        author: user.user,
        versions: [
          {
            name: '0.0.0',
            archive: 'asdf',
          },
        ],
      };

      await request(app.express)
        .post(`/api/v1/packages`)
        .set('Authorization', user.authToken)
        .send(packData)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          pack = res.body;
        });

      expect(pack).to.be.ok;
      expect(pack.name).to.be.ok;
    });

    describe('post /api/v1/packages/ID/versions', () => {
      it('should allow adding a new package at /api/v1/packages/ID/versions', async () => {
        const newPackage = {
          name: '1.0.0',
          archive: 'fdsa',
        };

        await request(app.express)
          .post(`/api/v1/packages/${pack.name}/versions`)
          .set('Authorization', user.authToken)
          .send(newPackage)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            const ver: IModelPackageVersion = res.body;
            expect(ver).to.be.ok;
            expect(ver.id).to.be.ok;
            expect(ver.name).to.eq(newPackage.name);
            expect(ver.archive).to.be.ok;
          });
      });

      it('should accept/reject access based upon the current user role', async () => {
        for (const key in CtrlUserRoles.roles) {
          if (!CtrlUserRoles.roles.hasOwnProperty(key)) {
            continue;
          }

          const role = CtrlUserRoles.roles[key] as IUserPermissions;
          const userTmp = await UserHelpers.createUserDetails(
            app, key, `${uuidv4()}@asdf.com`, 'asdfasdf1', key);

          const packageTmp = new app.db.models.Package({
            author: userTmp.user,
            name: uuidv4(),
            versions: [
              await new app.db.models.PackageVersion({ name: '1.0.0', archive: 'adsf' }).save(),
            ],
          });

          await packageTmp.save();

          const query = request(app.express)
            .post(`/api/v1/packages/${packageTmp.name}/versions`)
            .send({
              name: '1.1.0',
              archive: 'fdsa',
            })
            .expect('Content-Type', /json/);

          if (key !== 'guest') {
            query.set('Authorization', userTmp.authToken);
          }

          if (role.createOwnPackage) {
            query.expect(200);
          } else {
            query.expect(401);
          }

          await query.then((res) => {
            expect(res).to.be.ok;
          });
        }
      });
    });

    describe('get /api/v1/packages/ID/versions/ID', () => {
      it('should get a package at /api/v1/packages/ID/versions/ID', async () => {
        const ver = pack.versions[0];

        await request(app.express)
          .get(`/api/v1/packages/${pack.name}/versions/${ver.name}`)
          .set('Authorization', user.authToken)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            const verResult: IModelPackageVersion = res.body;
            expect(verResult).to.be.ok;
            expect(verResult.id).to.eq(ver.id);
            expect(verResult.name).to.eq(ver.name);
            expect(verResult.archive).to.eq(ver.archive);
          });
      });

      it('should accept/reject access based upon the current user role', async () => {
        const ver = pack.versions[0];

        for (const key in CtrlUserRoles.roles) {
          if (!CtrlUserRoles.roles.hasOwnProperty(key)) {
            continue;
          }

          const role = CtrlUserRoles.roles[key] as IUserPermissions;
          const token = await UserHelpers.getTokenFromApp(app, key);

          const query = request(app.express)
            .get(`/api/v1/packages/${pack.name}/versions/${ver.name}`)
            .expect('Content-Type', /json/);

          if (key !== 'guest') {
            query.set('Authorization', `Bearer ${token}`);
          }

          if (role.getPackage) {
            query.expect(200);
          } else {
            query.expect(401);
          }

          await query.then((res) => {
            expect(res).to.be.ok;
          });
        }
      });
    });

    describe('delete /api/v1/packages/ID/versions/ID', () => {
      it('should delete a package', async () => {
        let ver: IModelPackageVersion = undefined as any;
        const verData = {
          name: '1.0.0',
          archive: 'fdsa',
        };

        await request(app.express)
          .post(`/api/v1/packages/${pack.name}/versions`)
          .set('Authorization', user.authToken)
          .send(verData)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            ver = res.body;
            expect(ver).to.be.ok;
          });

        await request(app.express)
          .delete(`/api/v1/packages/${pack.name}/versions/${ver.name}`)
          .set('Authorization', user.authToken)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            const result: { message: string } = res.body;
            expect(result).to.be.ok;
            expect(result.message).to.be.ok;
            expect(result.message).to.contain('Package removed');
          });
      });

      it('should allow access based upon the current role', async () => {
        for (const key in CtrlUserRoles.roles) {
          if (!CtrlUserRoles.roles.hasOwnProperty(key)) {
            continue;
          }

          const role = CtrlUserRoles.roles[key] as IUserPermissions;
          const userTmp = await UserHelpers.createUserDetails(
            app, key, `${uuidv4()}@asdf.com`, 'asdfasdf1', key);

          const ver1 = await new app.db.models.PackageVersion({ name: '1.0.0', archive: 'adsf' }).save();
          const packageTmp = new app.db.models.Package({
            author: userTmp.user,
            name: uuidv4(),
            versions: [
              ver1,
              await new app.db.models.PackageVersion({ name: '1.1.0', archive: 'adsf' }).save(),
            ],
          });

          await packageTmp.save();

          const query = request(app.express)
            .delete(`/api/v1/packages/${packageTmp.name}/versions/${ver1.name}`)
            .expect('Content-Type', /json/);

          if (key !== 'guest') {
            query.set('Authorization', userTmp.authToken);
          }

          if (role.deleteOwnPackages) {
            query.expect(200);
          } else {
            query.expect(401);
          }

          await query.then((res) => {
            expect(res).to.be.ok;
          });
        }
      });
    });
  });
});
