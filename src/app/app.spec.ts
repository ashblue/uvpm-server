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
      app.db.connection.once('connected', () => {
        expect(app.db.url).to.equal(appConfig.DB_TEST_URL);
        app.db.closeConnection(done);
      });
    });

    it('should connect to the testing database on TEST env variable being set to true', (done) => {
      process.env.TEST = 'true';

      app = new App();
      app.db.connection.once('connected', () => {
        expect(app.db.url).to.equal(appConfig.DB_TEST_URL);
        app.db.closeConnection(done);
      });
    });

    it('should connect to the regular database on TEST env variable being set to false', (done) => {
      process.env.TEST = 'false';

      app = new App();
      app.db.connection.once('connected', () => {
        expect(app.db.url).to.equal(appConfig.DB_DEFAULT_URL);
        app.db.closeConnection(done);
      });
    });
  });

  it('should set the public folder to readable', (done) => {
    const fileText = 'Test';
    const file = 'test.txt';
    const publicFolder = appConfig.PUBLIC_FOLDER;
    const fileFolder = `${publicFolder}/${appConfig.fileFolder}`;
    const filePath = `${fileFolder}/${file}`;

    // Sanity check BEGIN
    if (!fs.existsSync(fileFolder)) {
      fs.mkdirSync(fileFolder);
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    fs.writeFileSync(filePath, fileText);

    expect(fs.existsSync(filePath)).to.be.ok;
    // Sanity check END

    app = new App();
    app.createServer(appConfig.DEFAULT_PORT, (err) => {
      expect(err).to.not.be.ok;

      const reqPath = `${appConfig.ROOT_URL_TEST}/${appConfig.fileFolder}/${file}`;
      request(reqPath, (errReq: any, response: any, body: any) => {
        expect(errReq).to.be.not.ok;
        expect(response.statusCode).to.eq(200);
        expect(body).to.contain(fileText);

        expect(fs.existsSync(filePath)).to.be.ok;
        app.server.close();
        fs.unlinkSync(filePath);
        app.db.closeConnection(done);
      });
    });
  });

  describe('after initializing', () => {
    beforeEach((done) => {
      app = new App();
      app.db.connection.once('connected', done);
    });

    afterEach((done) => {
      app.db.closeConnection(done);
    });

    it('should create a public express object', () => {
      assert.notEqual(app.express, undefined);
    });

    it('should set the port on creation', (done) => {
      app.createServer(3000, () => {
        assert.equal(app.port, 3000);
        app.server.close();
        done();
      });
    });
  });
});
