import { App } from '../../../../../app';
import request = require('supertest');
import { userHelpers } from '../../../../../helpers/user-helpers';

import * as chai from 'chai';
import { IUserLogin } from '../../../../../models/user/i-user-login';
import { IPackageData } from '../../../../../models/package/i-package-data';
import { IModelPackage } from '../../../../../models/package/i-model-package';
import { IModelPackageVersion } from '../../../../../models/package/version/i-model-package-version';
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
    user = await userHelpers.createUser(app, 'Roger', 'roger@gmail.com', 'asdf1234a');
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

    it('should delete a package at /api/v1/packages/ID/versions/ID', async () => {
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
  });
});
