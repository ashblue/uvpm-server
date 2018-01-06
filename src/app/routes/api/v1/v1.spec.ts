import {App} from '../../../app';

import * as chai from 'chai';
const expect = chai.expect;

describe('RouteV1', () => {
  let app: App;

  beforeEach((done) => {
    app = new App();
    app.db.connection.once('open', done);
  });

  afterEach((done) => {
    app.db.closeConnection(done);
  });

  it('should initialize', () => {
    expect(app.routes.v1).to.be.ok;
  });

  it('should populate the users route', () => {
    expect(app.routes.v1.users).to.be.ok;
  });
});
