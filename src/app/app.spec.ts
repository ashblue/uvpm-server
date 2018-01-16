import { App } from './app';
import * as assert from 'assert';
import * as process from 'process';
import * as chai from 'chai';
import { appConfig } from './helpers/app-config';
import * as fs from 'fs';

const request = require('request');
const expect = chai.expect;

describe('App', () => {
  let app: App;

  describe('setting TEST environmental variable', () => {
    afterEach(() => {
      // Prevent other tests from connecting to the default database
      process.env.TEST = 'true';
    });

    it('should default to testing the test database for tests', (done) => {
      app = new App();
      app.db.connection.once('open', () => {
        expect(app.db.url).to.equal(appConfig.DB_TEST_URL);
        app.db.closeConnection(done);
      });
    });

    it('should connect to the testing database on TEST env variable being set to true', (done) => {
      process.env.TEST = 'true';

      app = new App();
      app.db.connection.once('open', () => {
        expect(app.db.url).to.equal(appConfig.DB_TEST_URL);
        app.db.closeConnection(done);
      });
    });

    it('should connect to the regular database on TEST env variable being set to false', (done) => {
      process.env.TEST = 'false';

      app = new App();
      app.db.connection.once('open', () => {
        expect(app.db.url).to.equal(appConfig.DB_DEFAULT_URL);
        app.db.closeConnection(done);
      });
    });
  });

  it('should set the public folder to readable', (done) => {
    const fileText = 'Test';
    const file = 'test.txt';
    const filePath = `${appConfig.PUBLIC_FOLDER}/${file}`;

    fs.writeFileSync(filePath, fileText);
    app = new App();
    app.db.connection.once('open', () => {
      request(`${appConfig.ROOT_URL_TEST}/${file}`, (errReq, response, body) => {
        expect(errReq).to.be.not.ok;
        expect(response.statusCode).to.eq(200);
        expect(body).to.contain(fileText);

        fs.unlinkSync(filePath);
        expect(fs.existsSync(filePath)).to.be.not.ok;

        app.db.closeConnection(done);
      });
    });
  });

  describe('after initializing', () => {
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
});
