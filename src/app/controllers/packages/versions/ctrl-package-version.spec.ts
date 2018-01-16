import { Database } from '../../databases/database';
import { CtrlUser } from '../../users/ctrl-user';
import { appConfig } from '../../../helpers/app-config';

import * as chai from 'chai';
import { CtrlPackageVersion } from './ctrl-package-version';
import { fileHelper } from '../../../helpers/file-helper';
import { IPackageVersionData } from '../../../models/package/version/i-package-version-data';
const expect = chai.expect;

describe('CtrlPackageVersion', () => {
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

  after((done) => {
    fileHelper.clearFileTestFolder((err) => {
      expect(err).to.be.not.ok;
      done();
    });
  });

  it('should initialize', () => {
    const ctrl = new CtrlUser(db);

    expect(ctrl).to.be.ok;
  });

  describe('when initialized', () => {
    let ctrl: CtrlPackageVersion;
    let fileBase64: string;

    beforeEach((done) => {
      ctrl = new CtrlPackageVersion(db);
      expect(ctrl).to.be.ok;

      fileHelper.createBase64File(1, (base64) => {
        fileBase64 = base64;
        done();
      });
    });

    describe('create', () => {
      it('should create a new name object', (done) => {
        ctrl.create({
          name: 'asdf',
          archive: fileBase64,
        }, (err, result) => {
          expect(err).to.be.not.ok;
          expect(result).to.be.ok;

          if (result) {
            expect(result.name).to.eq('asdf');
            expect(result.archive).to.be.ok;
          }

          done();
        });
      });

      it('should error if invalid data is provided', (done) => {
        ctrl.create({
          name: '',
          archive: fileBase64,
        }, (err) => {
          expect(err).to.be.ok;
          if (err) {
            expect(err.message).to.contain('Version name is required');
          }

          done();
        });
      });
    });

    describe('sanitize', () => {
      it('should return a cleaned version', () => {
        const version: IPackageVersionData = {
            name: 'name',
            archive: 'archive',
        };

        const cleaned = ctrl.sanitize(version);

        expect(cleaned.name).eq(version.name);
        expect(cleaned.archive).eq(version.archive);
        expect(cleaned.description).to.not.be.ok;
      });
    });

    describe('sanitizeMany', () => {
      it('should return an array of sanitized versions', () => {
        const versions: IPackageVersionData[] = [
          {
            name: 'name',
            archive: 'archive',
            description: 'description',
          },
          {
            name: 'asdf',
            archive: 'asdf',
            description: 'asdf',
          },
        ];

        const cleaned = ctrl.sanitizeMany(versions);

        expect(cleaned.length).eq(2);
        expect(cleaned[0].name).eq('name');
        expect(cleaned[0].archive).eq('archive');
        expect(cleaned[0].description).eq('description');
      });

      it('should not inject an empty description', () => {
        const versions: IPackageVersionData[] = [
          {
            name: 'name',
            archive: 'archive',
          },
        ];

        const cleaned = ctrl.sanitizeMany(versions);

        expect(cleaned[0]).to.not.haveOwnProperty('description');
      });

      it('should return an empty array on an empty argument', () => {
        const versions: any = null;

        const cleaned = ctrl.sanitizeMany(versions);

        expect(cleaned).to.be.ok;
        expect(cleaned.length).eq(0);
      });

      it('should remove undefined and null array elements', () => {
        const empty: any = null;
        const emptyB: any = undefined;

        const versions: IPackageVersionData[] = [
          {
            name: 'name',
            archive: 'archive',
            description: 'description',
          },
          empty,
          emptyB,
        ];

        const cleaned = ctrl.sanitizeMany(versions);

        expect(cleaned.length).eq(1);
        expect(cleaned[0].name).eq('name');
        expect(cleaned[0].archive).eq('archive');
        expect(cleaned[0].description).eq('description');
      });

      it('should convert object properties to corresponding types', () => {
        const num: any = 12345;
        const str: string = num.toString();

        const versions: IPackageVersionData[] = [
          {
            name: num,
            archive: num,
            description: num,
          },
        ];

        const cleaned = ctrl.sanitizeMany(versions);

        expect(cleaned.length).eq(1);
        expect(cleaned[0].name).eq(str);
        expect(cleaned[0].archive).eq(str);
        expect(cleaned[0].description).eq(str);
      });
    });

    describe('createMany', () => {
      it('should convert an array of objects to package version models with id', (done) => {
        const versions: IPackageVersionData[] = [
          {
            name: 'name',
            archive: 'archive',
            description: 'description',
          },
          {
            name: 'asdf',
            archive: 'asdf',
          },
        ];

        const promise = ctrl.createMany(versions);
        promise.then((savedVersions) => {
          expect(savedVersions.length).eq(2);

          expect(savedVersions[0].name).eq('name');
          expect(savedVersions[0].archive).to.not.eq('archive');
          expect(savedVersions[0].description).eq('description');
          expect(savedVersions[0]._id).to.be.ok;

          expect(savedVersions[1].name).eq('asdf');
          expect(savedVersions[1].archive).to.not.eq('asdf');
          expect(savedVersions[1].description).to.not.be.ok;
          expect(savedVersions[1]._id).to.be.ok;

          done();
        });
      });
    });
  });
});
