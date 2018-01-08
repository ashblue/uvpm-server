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

      it('should reject an empty string', (done) => {
        const entry: IModelPackageCollection = new ModelPackageCollection({
          name: '',
        });

        entry.validate((err) => {
          expect(err.errors).to.be.ok;
          expect(err.errors.name.message).to.contain('Name is required');
          done();
        });
      });

      it('should reject a null value', (done) => {
        const entry: IModelPackageCollection = new ModelPackageCollection({
          name: null,
        });

        entry.validate((err) => {
          expect(err.errors).to.be.ok;
          expect(err.errors.name.message).to.contain('Name is required');
          done();
        });
      });

      it('should reject an undefined value', (done) => {
        const entry: IModelPackageCollection = new ModelPackageCollection({
          name: undefined,
        });

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

      it('should not allow uppercase letters', (done) => {
        const entry = new ModelPackageCollection({
          name: 'ASDF',
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name.message).to.contain('Names can only contain lowercase letters');
          done();
        });
      });

      it('should allow numbers', (done) => {
        const entry = new ModelPackageCollection({
          name: '12345',
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow numbers with text', (done) => {
        const entry = new ModelPackageCollection({
          name: 'asdf12345',
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow dashes with numbers', (done) => {
        const entry = new ModelPackageCollection({
          name: '12345-1234',
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow dashes with text', (done) => {
        const entry = new ModelPackageCollection({
          name: 'asdf-asdf-fdsa',
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow dashes with numbers and text', (done) => {
        const entry = new ModelPackageCollection({
          name: 'asdf-12345',
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should not allow dashes without text', (done) => {
        const entry = new ModelPackageCollection({
          name: '-',
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow double dashes', (done) => {
        const entry = new ModelPackageCollection({
          name: 'asdf--asdf',
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow dashes on the beginning of text', (done) => {
        const entry = new ModelPackageCollection({
          name: '-asdf',
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow dashes on the end of text', (done) => {
        const entry = new ModelPackageCollection({
          name: 'asdf-',
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should reject all characters that aren\'t spaces or dashes', (done) => {
        const entry = new ModelPackageCollection({
          name: 'asdf@34jsdfkjl23-&456548a*',
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not validate if another package collection has the same name', (done) => {
        const name = 'asdf-asdf';
        const entry = new ModelPackageCollection({name});
        const entry2 = new ModelPackageCollection({name});

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
        const entry = new ModelPackageCollection({name});

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

      xit('should require a valid owner if changed', () => {
        console.log('placeholder');
      });
    });

    describe('packages', () => {
      xit('should have a list of packages', () => {
        console.log('placeholder');
      });

      xit('should require at least one created package to validate', () => {
        console.log('placeholder');
      });
    });
  });
});
