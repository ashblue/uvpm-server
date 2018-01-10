import { Database } from '../databases/database';
import { appConfig } from '../../helpers/app-config';
import { ModelCollection } from './model-collection';

import * as chai from 'chai';
const expect = chai.expect;

describe('ModelCollection', () => {
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
    new ModelCollection(db);
  });

  it('should populate the user model', () => {
    const col = new ModelCollection(db);
    expect(col.User).to.be.ok;
  });

  it('should populate the package model', () => {
    const col = new ModelCollection(db);
    expect(col.Package).to.be.ok;
  });

  it('should populate the package collection model', () => {
    const col = new ModelCollection(db);
    expect(col.PackageCollection).to.be.ok;
  });
});
