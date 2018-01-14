import { Database } from '../../databases/database';
import { CtrlUser } from '../../users/ctrl-user';
import { appConfig } from '../../../helpers/app-config';

import * as chai from 'chai';
import { CtrlPackageVersion } from './ctrl-package-version';
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

  it('should initialize', () => {
    const ctrl = new CtrlUser(db);

    expect(ctrl).to.be.ok;
  });

  describe('when initialized', () => {
    let ctrl: CtrlPackageVersion;

    beforeEach(() => {
      ctrl = new CtrlPackageVersion(db);
      expect(ctrl).to.be.ok;
    });

    describe('create', () => {
      xit('should create a new version and fire a callback with the new object', (done) => {
        // ctrl.create({version: '1.0.0'}, FILEHERE, done);
      });

      xit('should error if an invalid object is provided', () => {
        console.log('placeholder');
      });

      describe('file handling', () => {
        xit('should attach an http code to access the archive', () => {
          console.log('placeholder');
        });

        xit('should fail if a file isn\'t provided', () => {
          console.log('placeholder');
        });

        xit('should fail if the file size is too large', () => {
          console.log('placeholder');
        });

        xit('should only accept *.tar.b2z files', () => {
          console.log('placeholder');

        });

        xit('should limit file size to 5mb', () => {
          console.log('placeholder');
        });
      });
    });
  });
});
