import * as mongoose from 'mongoose';
import {Database} from '../../controllers/databases/database';
import {appConfig} from '../../helpers/app-config';
import {IModelUser, ModelUserSchema} from './model-user';

import * as chai from 'chai';
chai.should();

describe('ModelBase', () => {
  let db: Database;
  let ModelUser: mongoose.Model<IModelUser>;

  beforeEach((done) => {
    db = new Database(appConfig.DB_DEFAULT_URL, (dbRef) => {
      ModelUser = dbRef.connection.model('user', new ModelUserSchema().schema);
      done();
    });
  });

  afterEach((done) => {
    db.closeConnection(done);
  });

  xit('should insert a new valid user', () => {
    console.log('placeholder');
  });

  describe('definition property', () => {
    describe('createdAt', () => {
      it('should not allow the creation date to be overwritten', (done) => {
        const m = new ModelUser({
          name: 'asdf asdf',
          email: 'asdf@asdf.com',
          password: 'asdfasdf',
        });

        m.save((err, entry) => {
          entry.createdAt = new Date(0);
          entry.save((err, entry) => {
            err.toString().should.contain('createdAt cannot be modified');
            done();
          });
        });
      });

      it('should inject a creation date upon initialization', () => {
        const m = new ModelUser({
          name: 'asdf asdf',
          email: 'asdf@asdf.com',
          password: 'asdfasdf',
        });

        m.createdAt.should.not.be.undefined;
      });
    });

    describe('name', () => {
      it('should not validate without a name', (done) => {
        const m = new ModelUser({
          email: 'asdf@asdf.com',
          password: 'asdfasdf',
        });

        m.validate((err) => {
          if (err) {
            done();
          } else {
            throw new Error('Should not have validated');
          }
        });
      });
    });

    describe('email', () => {
      xit('should not validate without an email', () => {
        console.log('placeholder');
      });

      xit('should not validate an invalid email', () => {
        console.log('placeholder');
      });

      xit('should not allow duplicate emails', () => {
        // Possible answer
        // https://stackoverflow.com/questions/43962430/mongoose-how-to-prevent-mongodb-to-save-duplicate-email-records-in-database
      });
    });

    describe('password', () => {
      xit('should require a password', () => {
        console.log('placeholder');
      });

      xit('should require the password to be 8 characters', () => {
        console.log('placeholder');
      });

      xit('should require the password to have at least one letter', () => {
        console.log('placeholder');
      });

      xit('should require the password to have at least one number', () => {
        console.log('placeholder');
      });
    });

    describe('id', () => {
      xit('should not allow the ID to be updated', () => {
        console.log('hit');
      });
    });
  });

  describe('JSON export', () => {
    let modelStub: mongoose.Document;

    beforeEach(() => {
      modelStub = new ModelUser({
        name: 'Lorem Ipsum',
        email: 'asdf@asdf.com',
        password: 'asdfasdf',
      });
    });

    it('should have a creation date', () => {
      modelStub.toJSON().should.haveOwnProperty('createdAt');
    });

    it('should have a name', () => {
      modelStub.toJSON().should.haveOwnProperty('name');
    });

    it('should have an email', () => {
      modelStub.toJSON().should.haveOwnProperty('email');
    });

    it('should hide the _id MongoDB property', () => {
      modelStub.toJSON().should.not.haveOwnProperty('_id');
    });

    it('should not have a password', () => {
      modelStub.toJSON().should.not.haveOwnProperty('password');
    });
  });
});
