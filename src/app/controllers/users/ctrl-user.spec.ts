import * as express from 'express';
import {Database} from '../databases/database';
import {appConfig} from '../../helpers/app-config';
import {CtrlUser} from './ctrl-user';

import request = require('supertest');
import bodyParser = require('body-parser');

import * as chai from 'chai';
const expect = chai.expect;

describe('CtrlUser', () => {
  let db: Database;

  beforeEach((done) => {
    db = new Database(appConfig.DB_DEFAULT_URL, (dbRef) => {
      dbRef.connection.db.dropDatabase().then(() => {
        done();
      });
    });
  });

  afterEach((done) => {
    db.closeConnection(done);
  });

  it('should initialize', () => {
     const ctrl = new CtrlUser(db);

     expect(ctrl).to.be.ok;
  });

  describe('when initialized', () => {
    let ctrl: CtrlUser;
    let app: express.Application;

    beforeEach(() => {
      ctrl = new CtrlUser(db);
      app = express();
      app.use(bodyParser.json());

      app.post('/user', (req, res) => {
        ctrl.register(req, res);
      });
    });

    describe('register', () => {
      it('should register a user', (done) => {
        request(app)
          .post('/user')
          .send({
            name: 'Lorem Ipsum',
            email: 'asdf@asdf.com',
            password: 'asdfasd1',
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if (err) {
              console.log(res.error);
            }

            expect(err).to.be.not.ok;
            expect(res.body.name).to.be.ok;
            expect(res.body.email).to.be.ok;
            expect(res.body.password).to.not.be.ok;

            done();
          });
      });

      it('should return an error if registration fails', (done) => {
        request(app)
          .post('/user')
          .send({})
          .expect('Content-Type', /json/)
          .expect(500)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res.body.errors).to.be.ok;

            done();
          });
      });
    });
  });
});
