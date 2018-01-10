import * as mongoose from 'mongoose';
import { ModelUserSchema } from '../../models/user/model-user';
import { Database } from './database';
import { IModelUser } from '../../models/user/i-model-user';
import { IModelPackageCollection } from '../../models/package/collection/i-model-package-collection';
import { ModelPackageCollectionSchema } from '../../models/package/collection/model-package-collection';
import { ModelPackageSchema } from '../../models/package/model-package';
import { IModelPackage } from '../../models/package/i-model-package';

export class ModelCollection {
  public static readonly USER_ID = 'user';
  public static readonly PACKAGE_ID = 'package';
  public static readonly PACKAGE_COLLECTION_ID = 'packageCollection';

  public readonly User: mongoose.Model<IModelUser>;
  public readonly PackageCollection: mongoose.Model<IModelPackageCollection>;
  public readonly Package: mongoose.Model<IModelPackage>;

  constructor (db: Database) {
    this.User = db.connection.model(ModelCollection.USER_ID, new ModelUserSchema().schema);
    this.Package = db.connection.model(ModelCollection.PACKAGE_ID, new ModelPackageSchema().schema);
    this.PackageCollection = db.connection.model(ModelCollection.PACKAGE_COLLECTION_ID, new ModelPackageCollectionSchema().schema);
  }
}
