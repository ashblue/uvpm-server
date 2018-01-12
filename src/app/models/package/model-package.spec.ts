import { appConfig } from '../../helpers/app-config';
import { Database } from '../../controllers/databases/database';

import * as chai from 'chai';
import { IModelPackage } from './i-model-package';
chai.should();
const expect = chai.expect;

describe('ModelPackage', () => {
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
    const pack = new db.models.Package({});
    expect(pack).to.be.ok;
  });

  describe('schema', () => {
    describe('version', () => {
      it('should be a property', (done) => {
        const pack = new db.models.Package({
          version: 'a-0.1.4',
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackage) => {
          expect(err).to.not.be.ok;
          expect(result.version).to.be.ok;
          done();
        });
      });

      it('should be required on validation', (done) => {
        const pack = new db.models.Package();

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Version is required');
          done();
        });
      });

      it('should be trimmed when saved', (done) => {
        const version = 'a-0.1.4';
        const pack = new db.models.Package({
          version: `    ${version} `,
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackage) => {
          expect(err).to.not.be.ok;
          expect(result.version).to.equal(version);
          done();
        });
      });

      it('should allow numbers', (done) => {
        const version = '12345';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackage) => {
          expect(err).to.not.be.ok;
          expect(result.version).to.equal(version);
          done();
        });
      });

      it('should allow lowercase letters', (done) => {
        const version = 'asdf';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackage) => {
          expect(err).to.not.be.ok;
          expect(result.version).to.equal(version);
          done();
        });
      });

      it('should not allow uppercase letters', (done) => {
        const version = 'ASDF';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Only supports lowercase letters');

          done();
        });
      });

      it('should allow periods', (done) => {
        const version = '1.000.0';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackage) => {
          expect(err).to.not.be.ok;
          expect(result.version).to.equal(version);
          done();
        });
      });

      it('should not allow a stand alone period', (done) => {
        const version = '.';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Only supports lowercase letters');

          done();
        });
      });

      it('should not allow consecutive periods between characters', (done) => {
        const version = '1..0';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Only supports lowercase letters');

          done();
        });
      });

      it('should not allow a period at the beginning', (done) => {
        const version = '.1';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Only supports lowercase letters');

          done();
        });
      });

      it('should not allow a period at the ending', (done) => {
        const version = '1.';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Only supports lowercase letters');

          done();
        });
      });

      it('should allow a dash', (done) => {
        const version = '1-1';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err, result: IModelPackage) => {
          expect(err).to.not.be.ok;
          expect(result.version).to.equal(version);
          done();
        });
      });

      it('should not allow a stand alone dash', (done) => {
        const version = '-';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Only supports lowercase letters');

          done();
        });
      });

      it('should not allow consecutive dashes between characters', (done) => {
        const version = '1--a';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Only supports lowercase letters');

          done();
        });
      });

      it('should not allow a dash at the beginning', (done) => {
        const version = '-1a';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Only supports lowercase letters');

          done();
        });
      });

      it('should not allow a dash at the ending', (done) => {
        const version = '1a-';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Only supports lowercase letters');

          done();
        });
      });

      it('should not allow dashes and periods without text or numbers', (done) => {
        const version = '-.';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Only supports lowercase letters');

          done();
        });
      });

      it('should not allow special characters', (done) => {
        const version = '+.*.*';
        const pack = new db.models.Package({
          version,
          archive: 'asdf',
        });

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.version);
          expect(err.errors.version.message).to.contain('Only supports lowercase letters');

          done();
        });
      });
    });

    describe('archive', () => {
      it('should have a property', (done) => {
        const pack = new db.models.Package({
          version: 'a-0.1.4',
          archive: 'FILE_PATH',
        });

        pack.save((err, result: IModelPackage) => {
          expect(err).to.not.be.ok;
          expect(result.archive).to.be.ok;
          done();
        });
      });

      it('should be required', (done) => {
        const pack = new db.models.Package();

        pack.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.archive);
          expect(err.errors.archive.message).to.contain('`archive` is required');
          done();
        });
      });
    });
  });
});
