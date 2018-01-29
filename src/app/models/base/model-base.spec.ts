import * as mongoose from 'mongoose';
import { ModelBase } from './model-base';
import { Database } from '../../controllers/databases/database';
import { appConfig } from '../../helpers/app-config';
import { IModelBase } from './i-model-base';

import * as chai from 'chai';
chai.should();
const expect = chai.expect;

class ModelStubInternal extends ModelBase {
  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {
      name: {
        type: String,
      },
    };
  }
}

describe('ModelBase', () => {
  let db: Database;
  let ModelStub: mongoose.Model<IModelBase>;
  let modelStub: IModelBase;

  beforeEach((done) => {
    db = new Database(appConfig.DB_TEST_URL, (dbRef) => {
      ModelStub = dbRef.connection.model('Stub', new ModelStubInternal().schema);
      modelStub = new ModelStub({ name: 'test' });
      done();
    });
  });

  afterEach((done) => {
    db.closeConnection(done);
  });

  describe('schemaDefinition', () => {
    it('should merge the default schema definition with the new', () => {
      const schema = new ModelStubInternal().getSchemaDefinition();
      schema.should.haveOwnProperty('createdAt');
      schema.should.haveOwnProperty('name');
    });

    describe('createdAt', () => {
      it('should have a createdAt property', () => {
        expect(modelStub.createdAt).to.be.ok;
      });

      it('should not allow the creation date to be overwritten', (done) => {
        const m = new ModelStub({
        });

        m.save((err, entry) => {
          if (err) {
            console.log(err);
          }

          expect(err).to.be.null;

          entry.createdAt = new Date(0);
          entry.save((errSave) => {
            errSave.toString().should.contain('createdAt cannot be modified');
            done();
          });
        });
      });

      it('should inject a creation date upon initialization', () => {
        const m = new ModelStub({
        });

        m.createdAt.should.not.be.undefined;
      });
    });
  });

  describe('JSON export', () => {
    it('should have a creation date', () => {
      modelStub.toJSON().should.haveOwnProperty('createdAt');
    });

    it('should hide the _id MongoDB property', () => {
      modelStub.toJSON().should.not.haveOwnProperty('_id');
    });

    it('should hide the __v MongoDB property', () => {
      modelStub.toJSON().should.not.haveOwnProperty('__v');
    });

    it('should set the id property', () => {
      modelStub.toJSON().should.haveOwnProperty('id');
    });

    it('should delete the owner property', () => {
      modelStub.toJSON().should.not.haveOwnProperty('owner');
    });
  });
});
