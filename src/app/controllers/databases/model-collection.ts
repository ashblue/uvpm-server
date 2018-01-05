import * as mongoose from 'mongoose';
import {ModelUserSchema} from '../../models/user/model-user';
import {Database} from './database';
import {IModelUser} from '../../models/user/i-model-user';

export class ModelCollection {
  public readonly User: mongoose.Model<IModelUser>;

  constructor (db: Database) {
    this.User = db.connection.model('user', new ModelUserSchema().schema);
  }
}
