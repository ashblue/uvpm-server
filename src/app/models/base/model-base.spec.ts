import * as mongoose from 'mongoose';
import {ModelBase} from './model-base';
import {Database} from '../../controllers/databases/database';
import {appConfig} from '../../helpers/app-config';

import * as chai from 'chai';
chai.should();

class ModelStubInternal extends ModelBase {
  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {};
  }
}

describe('ModelBase', () => {
  let db: Database;
  let ModelStub: mongoose.Model<mongoose.Document>;

  beforeEach((done) => {
    db = new Database(appConfig.DB_DEFAULT_URL, () => {
      // @TODO Extend Typescript definition to include `mongoose.models: Model<Document>[]`
      ModelStub = mongoose['models'].Stub || mongoose.model('Stub', new ModelStubInternal().schema);

      done();
    });
  });

  afterEach((done) => {
    db.closeConnection(done);
  });

  describe('JSON export', () => {
    let modelStub: mongoose.Document;

    beforeEach(() => {
      modelStub = new ModelStub({});
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
