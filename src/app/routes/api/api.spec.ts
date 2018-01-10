import { App } from '../../app';

import * as chai from 'chai';
const expect = chai.expect;

describe('RouteApi', () => {
  let app: App;

  beforeEach((done) => {
    app = new App();
    app.db.connection.once('open', done);
  });

  afterEach((done) => {
    app.db.closeConnection(done);
  });

  it('should initialize', () => {
    expect(app.routes).to.be.ok;
  });

  it('should populate the v1 route', () => {
    expect(app.routes.v1).to.be.ok;
  });
});
