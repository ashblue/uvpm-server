import { App } from '../../../../app';
import request = require('supertest');
import { userHelpers } from '../../../../helpers/user-helpers';

import * as chai from 'chai';
import { IUserLogin } from '../../../../models/user/i-user-login';
import { IPackageData } from '../../../../models/package/i-package-data';
import { IModelPackage } from '../../../../models/package/i-model-package';
import { esHelpers } from '../../../../helpers/es-helpers';
import { IPackageSearchResult } from '../../../../models/package/i-package-search-result';
const expect = chai.expect;

describe('RoutePackages', () => {
  let app: App;
  let user: IUserLogin;

  beforeEach((done) => {
    app = new App();
    app.db.connection.once('open', () => {
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
    expect(app.routes.v1.packages).to.be.ok;
  });

  it('should allow creating a new package at /api/v1/packages', async () => {
    const pack: IPackageData = {
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
      .send(pack)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        const data: IModelPackage = res.body;
        expect(data).to.be.ok;

        expect(data.name).to.be.ok;
        expect(data.name).to.eq(pack.name);

        expect(data.author).to.be.ok;
        expect(data.author.id).to.eq(user.user.id);

        expect(data.versions).to.be.ok;
        expect(data.versions.length).to.eq(1);
        expect(data.versions[0]).to.be.ok;
        expect(data.versions[0].name).to.eq(pack.versions[0].name);
        expect(data.versions[0].archive).to.be.ok;
      });
  });

  describe('after creating a package', () => {
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
      expect(pack.id).to.be.ok;
    });

    it('should allow getting a package at /api/v1/packages/PACKAGE_NAME', async () => {
      await request(app.express)
        .get(`/api/v1/packages/${packData.name}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res).to.be.ok;

          const getResult: IModelPackage = res.body;
          expect(getResult).to.be.ok;
          expect(getResult.id).to.eq(pack.id);
        });
    });

    it('should allow deleting a package at /api/v1/packages/PACKAGE_NAME', async () => {
      await request(app.express)
        .delete(`/api/v1/packages/${packData.name}`)
        .set('Authorization', user.authToken)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res).to.be.ok;

          const getResult: { message: string } = res.body;
          expect(getResult).to.be.ok;
          expect(getResult.message).to.contain(`Successfully removed package ${packData.name}`);
        });
    });
  });

  // @NOTE Disabled because Elastic Search is randomly bombing out under heavy load
  xit('should send back package search results at /api/v1/packages/search/PACKAGE_NAME', async () => {
    let pack: IModelPackage = {} as any;
    const packData: IPackageData = {
      name: 'my-package',
      author: user.user,
      versions: [
        {
          name: '0.0.0',
          archive: 'asdf',
        },
      ],
    };

    await new Promise((resolve) => {
      esHelpers.resetElasticSearch(resolve);
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

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
    expect(pack.id).to.be.ok;

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    await request(app.express)
      .get(`/api/v1/packages/search/package`)
      .set('Authorization', user.authToken)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res).to.be.ok;

        const search: IPackageSearchResult[] = res.body;
        expect(search).to.be.ok;
        expect(search.length).to.eq(1);

        const hit = search[0];
        expect(hit).to.be.ok;
        expect(hit.author).to.eq(user.user.name);
        expect(hit.version).to.eq(packData.versions[0].name);
        expect(hit.name).to.eq(packData.name);
      });
  }).timeout(5000);
});
