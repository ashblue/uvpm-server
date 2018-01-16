import { appConfig } from '../../../helpers/app-config';
import { Database } from '../../../controllers/databases/database';
import * as chai from 'chai';
import { IModelPackageVersion } from './i-model-package-version';
import { IPackageVersionData } from './i-package-version-data';
import { App } from '../../../app';
import { fileHelper } from '../../../helpers/file-helper';
import * as async from 'async';

const request = require('request');

chai.should();
const expect = chai.expect;

describe('ModelPackageVersionSchema', () => {
  let app: App;
  let db: Database;

  beforeEach((done) => {
    app = new App();
    db = app.db;
    app.db.connection.once('open', () => {
      db.connection.db.dropDatabase().then(() => {
        done();
      });
    });
  });

  afterEach((done) => {
    db.closeConnection(done);
  });

  it('should initialize', (done) => {
    const data: IPackageVersionData = {
      name: 'asdf',
      archive: 'my-archive',
      description: 'my desc',
    };

    const pack = new db.models.PackageVersion(data);
    pack.save((err, product) => {
      expect(product).to.be.ok;

      expect(product.name).to.be.eq(data.name);
      expect(product.archive).to.not.be.eq(data.archive);
      expect(product.description).to.be.eq(data.description);

      done();
    });
  });

  describe('on creation', () => {
    describe('archive file handling', () => {
      it('should turn the archive into a relative path of public/tmp-files/*', (done) => {
        const data: IPackageVersionData = {
          name: 'asdf',
          archive: 'my-archive',
          description: 'my desc',
        };

        const pack = new db.models.PackageVersion(data);
        pack.save((err, product) => {
          expect(err).to.not.be.ok;
          expect(product).to.be.ok;
          expect(product.archive).to.contain(appConfig.FILE_FOLDER_TEST);

          done();
        });
      });

      it('should place the file in public/tmp-files', (done) => {
        const data: IPackageVersionData = {
          name: 'asdf',
          archive: 'my-archive',
          description: 'my desc',
        };

        const pack = new db.models.PackageVersion(data);
        pack.save((err, product) => {
          expect(err).to.not.be.ok;
          expect(product).to.be.ok;
          expect(product.archive).to.contain(appConfig.FILE_FOLDER_TEST);

          done();
        });
      });

      it('should convert the archive to a full http code when converted to JSON', (done) => {
        const data: IPackageVersionData = {
          name: 'asdf',
          archive: 'my-archive',
          description: 'my desc',
        };

        const pack = new db.models.PackageVersion(data);
        pack.save((err, product) => {
          expect(err).to.not.be.ok;
          expect(product).to.be.ok;

          const converted: any = product.toJSON();
          expect(converted.archive).to.contain('http://localhost:3000/tmp-files/');
          expect(converted.archive).to.not.contain('/tmp-files/tmp-files');
          expect(converted.archive).to.not.contain('public');
          expect(converted.archive).to.contain(product.archive.replace('public/', ''));

          done();
        });
      });

      it('writes files to the public/files folder if out of test mode', (done) => {
        const data: IPackageVersionData = {
          name: 'asdf',
          archive: 'my-archive',
          description: 'my desc',
        };

        process.env.TEST = 'false';

        const pack = new db.models.PackageVersion(data);
        pack.save((err, product) => {
          process.env.TEST = 'true';
          expect(err).to.not.be.ok;
          expect(product).to.be.ok;
          expect(product.archive).to.contain(appConfig.FILE_FOLDER);

          done();
        });
      });

      it('should provide a working http address to download the file (via curl)', (done) => {
        const archive = 'Hello World';
        const data: IPackageVersionData = {
          name: 'asdf',
          archive: new Buffer(archive).toString('base64'),
          description: 'my desc',
        };

        const pack = new db.models.PackageVersion(data);
        pack.save((err, product) => {
          expect(err).to.not.be.ok;
          expect(product).to.be.ok;
          const converted: any = product.toJSON();

          request(converted.archive, (errReq, response, body) => {
            expect(errReq).to.be.not.ok;
            expect(response.statusCode).to.eq(200);
            expect(body).to.contain(archive);
            done();
          });
        });
      });

      it('should fail if the file size is over 5mb large', (done) => {
        const data: IPackageVersionData = {
          name: 'asdf',
          archive: '',
          description: 'my desc',
        };

        async.series([
          (callback) => {
            fileHelper.createBase64File(6, (result) => {
              data.archive = result;
              callback();
            });
          },
          (callback) => {
            const pack = new db.models.PackageVersion(data);
            pack.save((err) => {
              expect(err).to.be.ok;
              expect(err.toString()).to.contain('Files limited to 5mb');

              callback();
            });
          },
        ], () => {
          done();
        });
      });

      xit('should delete the archive file when deleted', () => {
        console.log('placeholder');
      });
    });
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
