import * as mongoose from 'mongoose';
import { ModelUserSchema } from '../../models/user/model-user';
import { Database } from './database';
import { IModelUser } from '../../models/user/i-model-user';
import { IModelPackageCollection } from '../../models/package/collection/i-model-package-collection';
import { ModelPackageCollectionSchema } from '../../models/package/collection/model-package-collection';

export class ModelCollection {
  public readonly User: mongoose.Model<IModelUser>;
  public readonly PackageCollection: mongoose.Model<IModelPackageCollection>;

  constructor (db: Database) {
    this.User = db.connection.model('user', new ModelUserSchema().schema);
    this.PackageCollection = db.connection.model('packageCollection', new ModelPackageCollectionSchema().schema);
  }
}
