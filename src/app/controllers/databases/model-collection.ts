import * as mongoose from 'mongoose';
import { ModelUserSchema } from '../../models/user/model-user';
import { Database } from './database';
import { IModelUser } from '../../models/user/i-model-user';
import { IModelPackage } from '../../models/package/i-model-package';
import { ModelPackageSchema } from '../../models/package/model-package';
import { ModelPackageVersionSchema } from '../../models/package/version/model-package-version';
import { IModelPackageVersion } from '../../models/package/version/i-model-package-version';

export class ModelCollection {
  public static readonly USER_ID = 'user';
  public static readonly PACKAGE_VERSION_ID = 'packageVersion';
  public static readonly PACKAGE_ID = 'package';

  public readonly User: mongoose.Model<IModelUser>;
  public readonly Package: mongoose.Model<IModelPackage>;
  public readonly PackageVersion: mongoose.Model<IModelPackageVersion>;

  constructor (db: Database) {
    this.User = db.connection.model(ModelCollection.USER_ID, new ModelUserSchema().schema);
    this.Package = db.connection.model(ModelCollection.PACKAGE_ID, new ModelPackageSchema(db.connection).schema);
    this.PackageVersion = db.connection.model(ModelCollection.PACKAGE_VERSION_ID, new ModelPackageVersionSchema().schema);
  }
}
