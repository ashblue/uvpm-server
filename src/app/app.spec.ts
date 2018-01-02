import { App } from './app';
import * as assert from 'assert';

describe('App', () => {
  let app: App;

  beforeEach((done) => {
    app = new App();
    app.db.connection.once('open', done);
  });

  afterEach((done) => {
    app.db.closeConnection(done);
  });

  it('should create a public express object', () => {
    assert.notEqual(app.express, undefined);
  });

  it('should set the port on creation', () => {
    app.createServer(3000);

    assert.equal(app.port, 3000);
  });
});
