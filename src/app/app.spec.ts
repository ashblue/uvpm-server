import { App } from './app';
import * as assert from 'assert';
import * as mongoose from 'mongoose';

describe('App', () => {
  let app: App;

  before((done) => {
    app = new App();

    // Make sure MongoDB has established a connection (otherwise shim it)
    if (mongoose.connection.db) {
      return done();
    }

    mongoose.connection.on('open', done);
  });

  it('should create a public express object', () => {
    assert.notEqual(app.express, undefined);
  });

  it('should set the port on creation', () => {
    app.createServer(3000);

    assert.equal(app.port, 3000);
  });
});
