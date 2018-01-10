import { appConfig } from '../../helpers/app-config';
import { Database } from '../../controllers/databases/database';

import * as chai from 'chai';
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
});
