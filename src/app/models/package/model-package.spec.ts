import { appConfig } from '../../helpers/app-config';
import { Database } from '../../controllers/databases/database';
import { IModelPackage } from './i-model-package';
import { IModelUser } from '../user/i-model-user';
import { IModelPackageVersion } from './version/i-model-package-version';
import * as async from 'async';
import * as _ from 'lodash';

import * as chai from 'chai';
chai.should();
const expect = chai.expect;

describe('ModelPackageSchema', () => {
  let db: Database;
  let owner: IModelUser;
  let pack: IModelPackageVersion;
  let packageCollectionDefault: any;

  function getPackageData (extend?: any): any {
    const data = {};

    _.merge(data, packageCollectionDefault);

    if (extend) {
      _.merge(data, extend);
    }

    return data;
  }

  beforeEach((done) => {
    db = new Database(appConfig.DB_TEST_URL, (dbRef) => {
      dbRef.connection.db.dropDatabase().then(() => {

        async.parallel([
          (complete) => {
            owner = new db.models.User({
              name: 'asdf',
              email: 'asdf@asdf.com',
              password: 'asdfasdf1',
            });

            owner.save((err, result) => {
              expect(err).to.not.be.ok;
              owner = result;
              complete();
            });
          },
          (complete) => {
            pack = new db.models.PackageVersion({
              name: 'asdf',
              archive: 'asdf',
            });
            pack.save((err, result) => {
              expect(err).to.not.be.ok;
              pack = result;
              complete();
            });
          },
        ], () => {
          packageCollectionDefault = {
            author: owner,
            name: 'asdf',
            versions: [
              pack,
            ],
          };

          done();
        });

      });
    });
  });

  afterEach((done) => {
    db.closeConnection(done);
  });

  it('should create a new item', (done) => {
    const entry = new db.models.Package({
      name: 'my-package',
      author: owner.id,
      versions: [pack.id],
    });

    entry.save((err, result) => {
      expect(err).to.not.be.ok;
      expect(result).to.be.ok;

      expect(result.name).to.be.ok;
      expect(result.name).to.be.eq('my-package');

      expect(result.author).to.be.ok;
      expect(result.author.toString()).to.be.eq(owner.id);

      expect(result.versions).to.be.ok;
      expect(result.versions).to.contain(pack.id);

      done();
    });
  });

  it('should delete all package versions when deleted', (done) => {
    const entry = new db.models.Package({
      name: 'my-package',
      author: owner.id,
      versions: [pack.id],
    });

    let savedEntry: IModelPackage;
    async.series([
      (callback) => {
        entry.save((err, product) => {
          savedEntry = product;
          callback(err);
        });
      },
      (callback) => {
        savedEntry.remove((err) => {
          callback(err);
        });
      },
      (callback) => {
        db.models.PackageVersion.findById(pack.id, (err, res) => {
          expect(res).to.not.be.ok;
          callback(err);
        });
      },
    ], (err, results) => {
      expect(err).to.not.be.ok;
      done();
    });
  });

  describe('schema', () => {
    describe('name', () => {
      it('should have this property', () => {
        const details = getPackageData();
        const entry: IModelPackage = new db.models.Package(details);

        expect(entry.name).to.be.ok;
      });

      it('should be required upon validation', (done) => {
        const entry = new db.models.Package({});

        entry.validate((err) => {
          expect(err.errors).to.be.ok;
          expect(err.errors.name.message).to.contain('Name is required');
          done();
        });
      });

      it('should reject an empty string', (done) => {
        const entry: IModelPackage = new db.models.Package({
          name: '',
        });

        entry.validate((err) => {
          expect(err.errors).to.be.ok;
          expect(err.errors.name.message).to.contain('Name is required');
          done();
        });
      });

      it('should reject a null value', (done) => {
        const entry: IModelPackage = new db.models.Package({
          name: null,
        });

        entry.validate((err) => {
          expect(err.errors).to.be.ok;
          expect(err.errors.name.message).to.contain('Name is required');
          done();
        });
      });

      it('should reject an undefined value', (done) => {
        const entry: IModelPackage = new db.models.Package({
          name: undefined,
        });

        entry.validate((err) => {
          expect(err.errors).to.be.ok;
          expect(err.errors.name.message).to.contain('Name is required');
          done();
        });
      });

      it('should allow letters', (done) => {
        const entry = new db.models.Package(getPackageData());

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should not allow uppercase letters', (done) => {
        const entry = new db.models.Package(getPackageData({
          name: 'ASDF',
        }));

        entry.validate((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name.message).to.contain('can only contain lowercase letters');
          done();
        });
      });

      it('should allow numbers', (done) => {
        const entry = new db.models.Package(getPackageData({
          name: '12345',
        }));

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow numbers with text', (done) => {
        const entry = new db.models.Package(getPackageData({
          name: 'asdf12345',
        }));

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow dashes with numbers', (done) => {
        const entry = new db.models.Package(getPackageData({
          name: '12345-1234',
        }));

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow dashes with text', (done) => {
        const entry = new db.models.Package(getPackageData({
          name: 'asdf-asdf-fdsa',
        }));

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow dashes with numbers and text', (done) => {
        const entry = new db.models.Package(getPackageData({
          name: 'asdf-12345',
        }));

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should not allow dashes without text', (done) => {
        const entry = new db.models.Package({
          name: '-',
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow double dashes', (done) => {
        const entry = new db.models.Package({
          name: 'asdf--asdf',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow dashes on the beginning of text', (done) => {
        const entry = new db.models.Package({
          name: '-asdf',
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow dashes on the end of text', (done) => {
        const entry = new db.models.Package({
          name: 'asdf-',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should reject all characters that aren\'t spaces or dashes', (done) => {
        const entry = new db.models.Package({
          name: 'asdf@34jsdfkjl23-&456548a*',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not validate if another package collection has the same name', (done) => {
        const name = 'asdf-asdf';
        const entry = new db.models.Package(getPackageData({ name }));
        const entry2 = new db.models.Package(getPackageData({ name }));

        entry.save((err) => {
          expect(err).to.be.not.ok;
          entry2.save((err) => {
            expect(err).to.be.ok;
            done();
          });
        });
      });

      it('should not allow the package name to change on update', (done) => {
        const name = 'asdf-asdf';
        const newName = 'asdf';
        const entry = new db.models.Package(getPackageData({
          name,
        }));

        entry.save((err) => {
          expect(err).to.be.not.ok;

          entry.name = newName;
          entry.save((err, result) => {
            expect(err).to.be.ok;
            expect(result).to.be.undefined;
            done();
          });
        });
      });
    });

    describe('author', () => {
      it('should have an author property', (done) => {
        const packCol = new db.models.Package(getPackageData({
          name: 'asdf',
          author: owner,
        }));

        packCol.save((err, result: IModelPackage) => {
          expect(err).to.not.be.ok;
          expect(result.author).to.be.ok;
          done();
        });
      });

      it('should be required upon creation', (done) => {
        const data = getPackageData();
        delete data['author'];
        const packCol = new db.models.Package(data);

        packCol.validate((err) => {
          expect(err).to.be.ok;
          expect(err.errors.author.message).to.contain('Author is required');
          done();
        });
      });

      it('should not allow null', (done) => {
        const packCol = new db.models.Package({
          name: 'asdf',
          author: null,
        });

        packCol.validate((err) => {
          expect(err).to.be.ok;
          expect(err.errors.author.message).to.contain('Author is required');
          done();
        });
      });

      it('should not allow undefined', (done) => {
        const packCol = new db.models.Package({
          name: 'asdf',
          author: undefined,
        });

        packCol.validate((err) => {
          expect(err).to.be.ok;
          expect(err.errors.author.message).to.contain('Author is required');
          done();
        });
      });

      it('should not allow a fake owner ID', (done) => {
        const packCol = new db.models.Package({
          name: 'asdf',
          author: owner._id + 1,
        });

        packCol.validate((err) => {
          expect(err).to.be.ok;
          expect(err.errors.author.message).to.contain('Cast to ObjectID failed');
          done();
        });
      });

      it('should accept an ID', (done) => {
        const packCol = new db.models.Package(getPackageData({
          name: 'asdf',
          author: owner.id,
        }));

        packCol.save((err, result) => {
          expect(err).to.not.be.ok;
          expect(result.author).to.be.ok;
          done();
        });
      });
    });

    describe('versions', () => {
      it('should have a list of versions', (done) => {
        const packCol = new db.models.Package(getPackageData());

        packCol.save((err, result: IModelPackage) => {
          expect(err).to.not.be.ok;
          expect(result.versions).to.be.ok;
          expect(result.versions.length).to.equal(1);
          done();
        });
      });

      it('should require at least one created package to validate', (done) => {
        const packCol = new db.models.Package({
          name: 'asdf',
          owner,
        });

        packCol.save((err) => {
          expect(err).be.ok;
          expect(err.errors).to.be.ok;
          expect(err.errors.versions).to.be.ok;
          expect(err.errors.versions.message).to.contain('`versions` require at least one version to initialize');

          done();
        });
      });

      it('should require that new versions have a unique name for the current collection', (done) => {
        const packCol = new db.models.Package(getPackageData());
        let packColUpdate: IModelPackage;
        const packAlt = new db.models.PackageVersion({
          name: pack.name,
          archive: 'asdf',
        });

        async.parallel([
          (callback) => {
            packCol.save((err, result: IModelPackage) => {
              expect(err).to.not.be.ok;
              expect(result.versions).to.be.ok;
              expect(result.versions.length).to.equal(1);
              packColUpdate = result;
              callback();
            });
          },
          (callback) => {
            packAlt.save((err) => {
              expect(err).to.not.be.ok;
              callback();
            });
          },
        ], () => {
          packColUpdate.versions.push(packAlt);
          packColUpdate.save((err) => {
            expect(err).to.be.ok;
            expect(err.errors).to.be.ok;
            expect(err.errors.versions).to.be.ok;
            expect(err.errors.versions.message).to.contain('additional versions must have a unique name');
            done();
          });
        });
      });
    });
  });
});
