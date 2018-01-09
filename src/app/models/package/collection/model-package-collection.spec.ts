import {appConfig} from '../../../helpers/app-config';
import {Database} from '../../../controllers/databases/database';
import {IModelPackageCollection} from './i-model-package-collection';

import * as chai from 'chai';
import { IModelUser } from '../../user/i-model-user';
chai.should();
const expect = chai.expect;

describe('ModelPackageCollection', () => {
  let db: Database;
  let owner: IModelUser;

  beforeEach((done) => {
    db = new Database(appConfig.DB_TEST_URL, (dbRef) => {
      dbRef.connection.db.dropDatabase().then(() => {
        owner = new db.models.User({
          name: 'asdf',
          email: 'asdf@asdf.com',
          password: 'asdfasdf1',
        });

        owner.save((err, result) => {
          expect(err).to.not.be.ok;
          owner = result;
          done();
        });
      });
    });
  });

  afterEach((done) => {
    db.closeConnection(done);
  });

  it('should create a new item', () => {
    const entry = new db.models.PackageCollection({});

    expect(entry).to.be.ok;
  });

  describe('schema', () => {
    describe('name', () => {
      it('should have this property', () => {
        const entry: IModelPackageCollection = new db.models.PackageCollection({
          name: 'asdf',
          owner,
        });

        expect(entry.name).to.be.ok;
      });

      it('should be required upon validation', (done) => {
        const entry = new db.models.PackageCollection({});

        entry.validate((err) => {
          expect(err.errors).to.be.ok;
          expect(err.errors.name.message).to.contain('Name is required');
          done();
        });
      });

      it('should reject an empty string', (done) => {
        const entry: IModelPackageCollection = new db.models.PackageCollection({
          name: '',
        });

        entry.validate((err) => {
          expect(err.errors).to.be.ok;
          expect(err.errors.name.message).to.contain('Name is required');
          done();
        });
      });

      it('should reject a null value', (done) => {
        const entry: IModelPackageCollection = new db.models.PackageCollection({
          name: null,
        });

        entry.validate((err) => {
          expect(err.errors).to.be.ok;
          expect(err.errors.name.message).to.contain('Name is required');
          done();
        });
      });

      it('should reject an undefined value', (done) => {
        const entry: IModelPackageCollection = new db.models.PackageCollection({
          name: undefined,
        });

        entry.validate((err) => {
          expect(err.errors).to.be.ok;
          expect(err.errors.name.message).to.contain('Name is required');
          done();
        });
      });

      it('should allow letters', (done) => {
        const entry = new db.models.PackageCollection({
          name: 'asdf',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should not allow uppercase letters', (done) => {
        const entry = new db.models.PackageCollection({
          name: 'ASDF',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name.message).to.contain('Names can only contain lowercase letters');
          done();
        });
      });

      it('should allow numbers', (done) => {
        const entry = new db.models.PackageCollection({
          name: '12345',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow numbers with text', (done) => {
        const entry = new db.models.PackageCollection({
          name: 'asdf12345',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow dashes with numbers', (done) => {
        const entry = new db.models.PackageCollection({
          name: '12345-1234',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow dashes with text', (done) => {
        const entry = new db.models.PackageCollection({
          name: 'asdf-asdf-fdsa',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should allow dashes with numbers and text', (done) => {
        const entry = new db.models.PackageCollection({
          name: 'asdf-12345',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.not.be.ok;
          done();
        });
      });

      it('should not allow dashes without text', (done) => {
        const entry = new db.models.PackageCollection({
          name: '-',
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow double dashes', (done) => {
        const entry = new db.models.PackageCollection({
          name: 'asdf--asdf',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow dashes on the beginning of text', (done) => {
        const entry = new db.models.PackageCollection({
          name: '-asdf',
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow dashes on the end of text', (done) => {
        const entry = new db.models.PackageCollection({
          name: 'asdf-',
          owner,
        });

        entry.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should reject all characters that aren\'t spaces or dashes', (done) => {
        const entry = new db.models.PackageCollection({
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
        const entry = new db.models.PackageCollection({name, owner});
        const entry2 = new db.models.PackageCollection({name, owner});

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
        const entry = new db.models.PackageCollection({
          name,
          owner,
        });

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
      it('should have an owner property', (done) => {
        const packCol = new db.models.PackageCollection({
          name: 'asdf',
          owner,
        });

        packCol.save((err, result: IModelPackageCollection) => {
          expect(err).to.not.be.ok;
          expect(result.owner).to.be.ok;
          done();
        });
      });

      it('should be required upon creation', (done) => {
        const packCol = new db.models.PackageCollection({
          name: 'asdf',
        });

        packCol.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow null', (done) => {
        const packCol = new db.models.PackageCollection({
          name: 'asdf',
          owner: null,
        });

        packCol.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow undefined', (done) => {
        const packCol = new db.models.PackageCollection({
          name: 'asdf',
          owner: undefined,
        });

        packCol.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should not allow a fake owner ID', (done) => {
        const packCol = new db.models.PackageCollection({
          name: 'asdf',
          owner: owner._id + 1,
        });

        packCol.validate((err) => {
          expect(err).to.be.ok;
          done();
        });
      });

      it('should accept an ID', (done) => {
        const packCol = new db.models.PackageCollection({
          name: 'asdf',
          owner: owner.id,
        });

        packCol.save((err, result) => {
          expect(err).to.not.be.ok;
          expect(result.owner).to.be.ok;
          done();
        });
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
