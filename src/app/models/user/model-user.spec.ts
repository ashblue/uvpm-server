import * as mongoose from 'mongoose';
import {Database} from '../../controllers/databases/database';
import {appConfig} from '../../helpers/app-config';
import {IModelUser, ModelUserSchema} from './model-user';

import * as chai from 'chai';
chai.should();
const expect = chai.expect;

describe('ModelBase', () => {
  const validPassword = 'asdfasd1';

  let db: Database;
  let ModelUser: mongoose.Model<IModelUser>;

  beforeEach((done) => {
    db = new Database(appConfig.DB_DEFAULT_URL, (dbRef) => {
      dbRef.connection.db.dropDatabase().then(() => {
        ModelUser = dbRef.connection.model('user', new ModelUserSchema().schema);
        done();
      });
    });
  });

  afterEach((done) => {
    db.closeConnection(done);
  });

  it('should insert a new valid user', (done) => {
    const user = new ModelUser({
      name: 'asdf asdf',
      email: 'asdf@asdf.com',
      password: validPassword,
    });

    user.save((err, record) => {
      expect(err).to.be.null;

      ModelUser.findById(record.id, (err, record) => {
        expect(err).to.be.null;
        expect(record).to.be.ok;
        done();
      });
    });
  });

  describe('definition property', () => {
    describe('createdAt', () => {
      it('should not allow the creation date to be overwritten', (done) => {
        const m = new ModelUser({
          name: 'asdf asdf',
          email: 'asdf@asdf.com',
          password: validPassword,
        });

        m.save((err, entry) => {
          if (err) {
            console.log(err);
          }

          expect(err).to.be.null;

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
          password: validPassword,
        });

        m.createdAt.should.not.be.undefined;
      });
    });

    describe('name', () => {
      it('should not validate without a name', (done) => {
        const m = new ModelUser({
          email: 'asdf@asdf.com',
          password: validPassword,
        });

        m.validate((err) => {
          expect(err.errors.name).to.not.be.undefined;
          done();
        });
      });
    });

    describe('email', () => {
      it('should not validate without an email', () => {
        it('should not validate without a name', (done) => {
          const m = new ModelUser({
            name: 'asdf',
            password: validPassword,
          });

          m.validate((err) => {
            expect(err.errors.email).to.not.be.undefined;
            done();
          });
        });
      });

      it('should not validate an invalid email', (done) => {
        const m = new ModelUser({
          name: 'asdf',
          password: validPassword,
          email: 'asdf',
        });

        m.validate((err) => {
          expect(err.errors.email).to.not.be.undefined;
          done();
        });
      });

      it('should validate a valid email', (done) => {
        const m = new ModelUser({
          name: 'asdf',
          password: validPassword,
          email: 'asdf@asdf.com',
        });

        m.validate((err) => {
          expect(err).to.be.null;
          done();
        });
      });

      it('should not allow duplicate emails', (done) => {
        const user1 = new ModelUser({
          name: 'asdf',
          password: validPassword,
          email: 'asdf@asdf.com',
        });

        const user2 = new ModelUser({
          name: 'asdf',
          password: validPassword,
          email: 'asdf@asdf.com',
        });

        user1.save((err) => {
          expect(err).to.be.null;

          user2.save((err) => {
            expect(err).to.not.be.undefined;
            expect(err.errmsg).to.contain('duplicate key error');

            done();
          });
        });
      });
    });

    describe('password', () => {
      it('should require a password', (done) => {
        const user = new ModelUser({
          name: 'asdf',
          email: 'asdf@asdf.com',
        });

        user.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.password.message).to.contain('require');
          done();
        });
      });

      it('should require the password to have 8 characters', (done) => {
        const user = new ModelUser({
          name: 'asdf',
          email: 'asdf@asdf.com',
          password: 'asdfasd',
        });

        user.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.password.message).to.contain('must be at least 8 characters');
          done();
        });
      });

      it('should require the password to have at least one letter', (done) => {
        const user = new ModelUser({
          name: 'asdf',
          email: 'asdf@asdf.com',
          password: '12341234',
        });

        user.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.password.message).to.contain('Must have at least one letter');
          done();
        });
      });

      it('should require the password to have at least one number', (done) => {
        const user = new ModelUser({
          name: 'asdf',
          email: 'asdf@asdf.com',
          password: 'asdfasdf',
        });

        user.save((err) => {
          expect(err).to.be.ok;
          expect(err.errors.password.message).to.contain('Must have at least one number');
          done();
        });
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
        password: validPassword,
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
