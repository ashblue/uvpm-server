import * as mongoose from 'mongoose';
import {IModelUser, ModelUserSchema} from '../../models/user/model-user';
import {Database} from './database';

export class ModelCollection {
  public readonly User: mongoose.Model<IModelUser>;

  constructor (db: Database) {
    this.User = db.connection.model('user', new ModelUserSchema().schema);
  }
}
