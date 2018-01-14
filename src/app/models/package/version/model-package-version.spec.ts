import { appConfig } from '../../../helpers/app-config';
import { Database } from '../../../controllers/databases/database';

import * as chai from 'chai';
import { IModelPackageVersion } from './i-model-package-version';
chai.should();
const expect = chai.expect;

describe('ModelPackageVersionSchema', () => {
  let db: Database;

  beforeEach((done) => {
    db = new Database(appConfig.DB_TEST_URL, (dbRef) => {
      dbRef.connection.db.dropDatabase().then(() => {
        done();
      });
    });
  });

  afterEach((done) => {
    db.closeConnection(done);
  });

  it('should initialize', () => {
    const pack = new db.models.PackageVersion({});
    expect(pack).to.be.ok;
  });

  describe('schema', () => {
    describe('version', () => {
      it('should be a property', (done) => {
        const pack = new db.models.PackageVersion({
          name: 'a-0.1.4',
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackageVersion) => {
          expect(err).to.not.be.ok;
          expect(result.name).to.be.ok;
          done();
        });
      });

      it('should be required on validation', (done) => {
        const pack = new db.models.PackageVersion();

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('Version name is required');
          done();
        });
      });

      it('should be trimmed when saved', (done) => {
        const version = 'a-0.1.4';
        const pack = new db.models.PackageVersion({
          name: `    ${version} `,
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackageVersion) => {
          expect(err).to.not.be.ok;
          expect(result.name).to.equal(version);
          done();
        });
      });

      it('should allow numbers', (done) => {
        const name = '12345';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackageVersion) => {
          expect(err).to.not.be.ok;
          expect(result.name).to.equal(name);
          done();
        });
      });

      it('should allow lowercase letters', (done) => {
        const name = 'asdf';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackageVersion) => {
          expect(err).to.not.be.ok;
          expect(result.name).to.equal(name);
          done();
        });
      });

      it('should not allow uppercase letters', (done) => {
        const name = 'ASDF';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('only supports lowercase letters');

          done();
        });
      });

      it('should allow periods', (done) => {
        const name = '1.000.0';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackageVersion) => {
          expect(err).to.not.be.ok;
          expect(result.name).to.equal(name);
          done();
        });
      });

      it('should not allow a stand alone period', (done) => {
        const name = '.';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('only supports lowercase letters');

          done();
        });
      });

      it('should not allow consecutive periods between characters', (done) => {
        const name = '1..0';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('only supports lowercase letters');

          done();
        });
      });

      it('should not allow a period at the beginning', (done) => {
        const name = '.1';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('only supports lowercase letters');

          done();
        });
      });

      it('should not allow a period at the ending', (done) => {
        const name = '1.';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('only supports lowercase letters');

          done();
        });
      });

      it('should allow a dash', (done) => {
        const name = '1-1';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackageVersion) => {
          expect(err).to.not.be.ok;
          expect(result.name).to.equal(name);
          done();
        });
      });

      it('should not allow a stand alone dash', (done) => {
        const name = '-';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('only supports lowercase letters');

          done();
        });
      });

      it('should not allow consecutive dashes between characters', (done) => {
        const name = '1--a';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('only supports lowercase letters');

          done();
        });
      });

      it('should not allow a dash at the beginning', (done) => {
        const name = '-1a';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('only supports lowercase letters');

          done();
        });
      });

      it('should not allow a dash at the ending', (done) => {
        const name = '1a-';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('only supports lowercase letters');

          done();
        });
      });

      it('should not allow dashes and periods without text or numbers', (done) => {
        const name = '-.';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('only supports lowercase letters');

          done();
        });
      });

      it('should not allow special characters', (done) => {
        const name = '+.*.*';
        const pack = new db.models.PackageVersion({
          name,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.name);
          expect(err.errors.name.message).to.contain('only supports lowercase letters');

          done();
        });
      });
    });

    describe('archive', () => {
      it('should have a property', (done) => {
        const pack = new db.models.PackageVersion({
          name: 'a-0.1.4',
          archive: 'FILE_PATH',
        });

        pack.save((err, result: IModelPackageVersion) => {
          expect(err).to.not.be.ok;
          expect(result.archive).to.be.ok;
          done();
        });
      });

      it('should be required', (done) => {
        const pack = new db.models.PackageVersion();

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.archive);
          expect(err.errors.archive.message).to.contain('Version archive is required');
          done();
        });
      });
    });

    describe('description', () => {
      it('should have a description', (done) => {
        const pack = new db.models.PackageVersion({
          name: 'a-0.1.4',
          archive: 'FILE_PATH',
          description: 'My description',
        });

        pack.save((err, result: IModelPackageVersion) => {
          expect(err).to.not.be.ok;
          expect(result.description).to.be.ok;
          done();
        });
      });

      it('should be optional', (done) => {
        const pack = new db.models.PackageVersion({
          name: 'a-0.1.4',
          archive: 'FILE_PATH',
        });

        pack.save((err, result: IModelPackageVersion) => {
          expect(err).to.not.be.ok;
          expect(result.description).to.be.not.ok;
          done();
        });
      });
    });
  });
});
