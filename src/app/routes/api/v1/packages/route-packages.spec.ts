import { App } from '../../../../app';
import request = require('supertest');
import { UserHelpers } from '../../../../helpers/user-helpers';

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
  let adminToken: string;

  beforeEach((done) => {
    app = new App();
    app.db.connection.once('connected', () => {
      app.db.connection.db.dropDatabase().then(() => {
        done();
      });
    });
  });

  beforeEach(async () => {
    adminToken = await UserHelpers.getTokenFromApp(app, 'admin');
  });

  beforeEach(async () => {
    user = await UserHelpers.createUserDetails(app, 'Roger', 'roger@gmail.com', 'asdf1234a');
  });

  afterEach((done) => {
    app.db.closeConnection(done);
  });

  it('should initialize', () => {
    expect(app.routes.v1.packages).to.be.ok;
  });

  describe('post /api/v1/packages', () => {
    it('should allow admins to create a new package', async () => {
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
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pack)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          const data: IModelPackage = res.body;
          expect(data).to.be.ok;

          expect(data.name).to.be.ok;
          expect(data.name).to.eq(pack.name);

          expect(data.versions).to.be.ok;
          expect(data.versions.length).to.eq(1);
          expect(data.versions[0]).to.be.ok;
          expect(data.versions[0].name).to.eq(pack.versions[0].name);
          expect(data.versions[0].archive).to.be.ok;
        });
    });

    it('should allow authors to create a new package', async () => {
      const authorToken = await UserHelpers.getTokenFromApp(app, 'author');

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
        .set('Authorization', `Bearer ${authorToken}`)
        .send(pack)
        .expect(200);
    });

    it('should not allow subscribers to create new packages', async () => {
      const subscriberToken = await UserHelpers.getTokenFromApp(app, 'subscriber');

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
        .set('Authorization', `Bearer ${subscriberToken}`)
        .send(pack)
        .expect(401);
    });

    it('should not allow non-authenticated users to create a package', async () => {
      await request(app.express)
        .post(`/api/v1/packages`)
        .send({})
        .expect(401);
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
        .set('Authorization', `Bearer ${adminToken}`)
        .send(packData)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          pack = res.body;
        });

      expect(pack).to.be.ok;
      expect(pack.id).to.be.ok;
    });

    describe('get /api/v1/packages/PACKAGE_NAME', () => {
      it('should allow admins to get a package', async () => {
        await request(app.express)
          .get(`/api/v1/packages/${packData.name}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            expect(res).to.be.ok;

            const getResult: IModelPackage = res.body;
            expect(getResult).to.be.ok;
            expect(getResult.id).to.eq(pack.id);
          });
      });

      it('should allow authors to get a package', async () => {
        const authorToken = await UserHelpers.getTokenFromApp(app, 'author');

        await request(app.express)
          .get(`/api/v1/packages/${packData.name}`)
          .set('Authorization', `Bearer ${authorToken}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            expect(res).to.be.ok;
          });
      });

      it('should allow subscribers to get a package', async () => {
        const subscriberToken = await UserHelpers.getTokenFromApp(app, 'subscriber');

        await request(app.express)
          .get(`/api/v1/packages/${packData.name}`)
          .set('Authorization', `Bearer ${subscriberToken}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            expect(res).to.be.ok;
          });
      });

      it('should not allow unauthorized users to get a package', async () => {
        await request(app.express)
          .get(`/api/v1/packages/${packData.name}`)
          .expect('Content-Type', /json/)
          .expect(401)
          .then((res) => {
            expect(res).to.be.ok;
          });
      });
    });

    describe('delete /api/v1/packages/PACKAGE_NAME', () => {
      it('should allow an admin to delete a package', async () => {
        await request(app.express)
          .delete(`/api/v1/packages/${packData.name}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            expect(res).to.be.ok;

            const getResult: { message: string } = res.body;
            expect(getResult).to.be.ok;
            expect(getResult.message).to.contain(`Successfully removed package ${packData.name}`);
          });
      });

      it('should not allow an author to delete a package', async () => {
        const authorToken = await UserHelpers.getTokenFromApp(app, 'author');

        await request(app.express)
          .delete(`/api/v1/packages/${packData.name}`)
          .set('Authorization', `Bearer ${authorToken}`)
          .expect('Content-Type', /json/)
          .expect(401)
          .then((res) => {
            expect(res).to.be.ok;
          });
      });

      it('should not allow a subscriber to delete a package', async () => {
        const subscriberToken = await UserHelpers.getTokenFromApp(app, 'subscriber');

        await request(app.express)
          .delete(`/api/v1/packages/${packData.name}`)
          .set('Authorization', `Bearer ${subscriberToken}`)
          .expect('Content-Type', /json/)
          .expect(401)
          .then((res) => {
            expect(res).to.be.ok;
          });
      });

      it('should not allow a guest to delete a package', async () => {
        await request(app.express)
          .delete(`/api/v1/packages/${packData.name}`)
          .expect('Content-Type', /json/)
          .expect(401)
          .then((res) => {
            expect(res).to.be.ok;
          });
      });
    });
  });

  describe('get /api/v1/packages/search/PACKAGE_NAME', () => {
    let packData: IPackageData;

    beforeEach(async () => {
      let pack: IModelPackage = {} as any;
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
                name: packData.name,
              },
            },
          ],
        },
      });

      await request(app.express)
        .post(`/api/v1/packages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(packData)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          pack = res.body;
        });

      expect(pack).to.be.ok;
      expect(pack.id).to.be.ok;
    });

    it('should allow admins to search package results', async () => {
      await request(app.express)
        .get(`/api/v1/packages/search/package`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res).to.be.ok;

          const search: IPackageSearchResult[] = res.body;
          expect(search).to.be.ok;
          expect(search.length).to.eq(1);

          const hit = search[0];
          expect(hit).to.be.ok;
          expect(hit.version).to.eq(packData.versions[0].name);
          expect(hit.name).to.eq(packData.name);
        });
    });

    it('should allow authors to search package results', async () => {
      const authorToken = await UserHelpers.getTokenFromApp(app, 'author');

      await request(app.express)
        .get(`/api/v1/packages/search/package`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res).to.be.ok;
        });
    });

    it('should allow subscribers to search package results', async () => {
      const subscriberToken = await UserHelpers.getTokenFromApp(app, 'subscriber');

      await request(app.express)
        .get(`/api/v1/packages/search/package`)
        .set('Authorization', `Bearer ${subscriberToken}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res).to.be.ok;
        });
    });

    it('should not allow guests to search package results', async () => {
      await request(app.express)
        .get(`/api/v1/packages/search/package`)
        .expect('Content-Type', /json/)
        .expect(401)
        .then((res) => {
          expect(res).to.be.ok;
        });
    });
  });
});
