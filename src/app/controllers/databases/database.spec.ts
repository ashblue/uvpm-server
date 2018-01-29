import { Database } from './database';
import { appConfig } from '../../helpers/app-config';

import * as chai from 'chai';
chai.should();
const expect = chai.expect;

describe('Database', () => {
  let db: Database;

  beforeEach((done) => {
    db = new Database(appConfig.DB_TEST_URL, () => done());
  });

  afterEach((done) => {
    db.closeConnection(() => done());
  });

  it('should store the default database url in a config file', () => {
    appConfig.should.have.property('DB_DEFAULT_URL');
  });

  it('should set MongoDB on to the passed url at creation', () => {
    db.url.should.equal(appConfig.DB_TEST_URL);
  });

  it('should run MongoDB on creation', () => {
    expect(db).to.be.ok;
  });

  it('should populate the database collection on calling models', () => {
    expect(db.models).to.be.ok;
  });
});
