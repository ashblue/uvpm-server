import {appConfig} from '../../../helpers/app-config';
import {Database} from '../../../controllers/databases/database';
import * as mongoose from 'mongoose';
import {IModelPackageCollection} from './i-model-package-collection';

import * as chai from 'chai';
import {ModelPackageCollectionSchema} from './model-package-collection';
chai.should();
const expect = chai.expect;

describe('ModelPackageCollection', () => {
  let db: Database;
  let ModelPackageCollection: mongoose.Model<IModelPackageCollection>;

  beforeEach((done) => {
    db = new Database(appConfig.DB_TEST_URL, (dbRef) => {
      dbRef.connection.db.dropDatabase().then(() => {
        ModelPackageCollection = dbRef.connection.model('packageCollection', new ModelPackageCollectionSchema().schema);
        done();
      });
    });
  });

  afterEach((done) => {
    db.closeConnection(done);
  });

  it('should create a new item', () => {
    const entry = new ModelPackageCollection({});

    expect(entry).to.be.ok;
  });

  describe('schema', () => {
    describe('name', () => {
      it('should have this property', () => {
        const entry: IModelPackageCollection = new ModelPackageCollection({
          name: 'asdf',
        });

        entry.name.should.equal('asdf');
      });

      it('should be required upon validation', (done) => {
        const entry = new ModelPackageCollection({});

        entry.validate((err) => {
          expect(err.errors).to.be.ok;
          expect(err.errors.name.message).to.contain('Name is required');
          done();
        });
      });

      it('should allow letters', (done) => {
        const entry = new ModelPackageCollection({
          name: 'asdf',
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      xit('should allow numbers', (done) => {
        const entry = new ModelPackageCollection({
          name: '12345',
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      xit('should allow dashes', () => {
        console.log('placeholder');
      });

      xit('should allow underscores', () => {
        console.log('placeholder');
      });

      xit('should allow dashes', () => {
        console.log('placeholder');
      });

      xit('should allow spaces', () => {
        console.log('placeholder');
      });

      xit('should allow periods', () => {
        console.log('placeholder');
      });

      xit('should allow letters, numbers, dashes, underscores, spaces, and periods', () => {
        console.log('placeholder');
      });

      xit('should reject all special characters that aren\t dashes or underscores', () => {
        console.log('placeholder');
      });

      xit('should not validate if another package collection has the same name', () => {
        console.log('placeholder');
      });
    });

    describe('description', () => {
      xit('should have a description property', () => {
        console.log('placeholder');
      });
    });

    describe('publicUrl', () => {
      xit('should have this property', () => {
        console.log('placeholder');
      });

      xit('should be a valid url', () => {
        console.log('placeholder');
      });
    });

    describe('owner', () => {
      xit('should have an owner property', () => {
        console.log('placeholder');
      });

      xit('should be required upon creation', () => {
        console.log('placeholder');
      });

      xit('should require an owner ID', () => {
        console.log('placeholder');
      });

      xit('should require a real owner that exists', () => {
        console.log('placeholder');
      });
    });

    describe('packages', () => {
      xit('should have a list of packages', () => {
        console.log('placeholder');
      });

      xit('should require at least one package to validate', () => {
        console.log('placeholder');
      });
    });
  });
});
