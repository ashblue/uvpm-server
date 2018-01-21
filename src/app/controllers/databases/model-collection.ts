import { ModelUserSchema } from '../../models/user/model-user';
import { Database } from './database';
import { IModelUser } from '../../models/user/i-model-user';
import { IModelPackage } from '../../models/package/i-model-package';
import { ModelPackageSchema } from '../../models/package/model-package';
import { ModelPackageVersionSchema } from '../../models/package/version/model-package-version';
import { IModelPackageVersion } from '../../models/package/version/i-model-package-version';
import * as mongoose from 'mongoose';
import { IEsModel } from '../../helpers/interfaces/elastic-search/i-es-model';
import { IEsPackageHit } from '../../models/package/i-es-package-hit';

import mongoosastic = require('mongoosastic');

export class ModelCollection {
  public static readonly USER_ID = 'user';
  public static readonly PACKAGE_VERSION_ID = 'packageVersion';
  public static readonly PACKAGE_ID = 'package';

  public readonly User: mongoose.Model<IModelUser>;
  public readonly Package: IEsModel<IModelPackage, IEsPackageHit>;
  public readonly PackageVersion: mongoose.Model<IModelPackageVersion>;

  constructor (db: Database) {
    this.User = db.connection.model(ModelCollection.USER_ID, new ModelUserSchema().schema);

    const schemaPackage = new ModelPackageSchema(db.connection).schema;
    schemaPackage.plugin(mongoosastic);
    this.Package = db.connection.model(ModelCollection.PACKAGE_ID, schemaPackage) as IEsModel<IModelPackage, IEsPackageHit>;

    this.PackageVersion = db.connection.model(ModelCollection.PACKAGE_VERSION_ID, new ModelPackageVersionSchema().schema);
  }
}
