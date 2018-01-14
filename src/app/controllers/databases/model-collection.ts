import * as mongoose from 'mongoose';
import { ModelUserSchema } from '../../models/user/model-user';
import { Database } from './database';
import { IModelUser } from '../../models/user/i-model-user';
import { IModelPackageCollection } from '../../models/package/collection/i-model-package-collection';
import { ModelPackageCollectionSchema } from '../../models/package/collection/model-package-collection';
import { ModelPackageVersionSchema } from '../../models/package/version/model-package-version';
import { IModelPackageVersion } from '../../models/package/version/i-model-package-version';

export class ModelCollection {
  public static readonly USER_ID = 'user';
  public static readonly PACKAGE_VERSION_ID = 'packageVersion';
  public static readonly PACKAGE_COLLECTION_ID = 'packageCollection';

  public readonly User: mongoose.Model<IModelUser>;
  public readonly PackageCollection: mongoose.Model<IModelPackageCollection>;
  public readonly PackageVersion: mongoose.Model<IModelPackageVersion>;

  constructor (db: Database) {
    this.User = db.connection.model(ModelCollection.USER_ID, new ModelUserSchema().schema);
    this.PackageVersion = db.connection.model(ModelCollection.PACKAGE_VERSION_ID, new ModelPackageVersionSchema().schema);
    this.PackageCollection = db.connection.model(ModelCollection.PACKAGE_COLLECTION_ID, new ModelPackageCollectionSchema(db.connection).schema);
  }
}
