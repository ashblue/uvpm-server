import { App } from './app';
import * as assert from 'assert';

describe('App', () => {
  it('should create a public express object', () => {
    const app = new App();

    assert.notEqual(app.express, undefined);
  });

  it('should set the port on creation', () => {
    const app = new App();
    app.createServer(3000);

    assert.equal(app.port, 3000);
  });
});
