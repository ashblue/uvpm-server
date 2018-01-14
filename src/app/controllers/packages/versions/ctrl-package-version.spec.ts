import { Database } from '../../databases/database';
import { CtrlUser } from '../../users/ctrl-user';
import { appConfig } from '../../../helpers/app-config';

import * as chai from 'chai';
import { CtrlPackageVersion } from './ctrl-package-version';
import { fileHelper } from '../../../helpers/file-creator';
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

      describe('file handling', () => {
        xit('should convert the archive to a full http code when returned', () => {
          // @TODO This should be done at the model level on JSON convert
          // @TODO The http prepend should only trigger if not an absolute URL
          console.log('placeholder');
        });

        xit('should place the file in public/tmp-files', () => {
          console.log('placeholder');
        });

        xit('writes files to the public/files folder if out of test mode', () => {
          console.log('placeholder');
        });

        xit('should provide a working http address to download the file', () => {
          console.log('placeholder');
        });

        xit('should fail if the file size is over 5mb large', () => {
          console.log('placeholder');
        });
      });
    });
  });
});
