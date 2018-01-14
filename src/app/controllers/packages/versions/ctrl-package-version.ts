import { IModelPackage } from '../../../models/package/i-model-package';
import { Database } from '../../databases/database';
import { IPackageData } from '../../../models/package/i-package-data';

export class CtrlPackageVersion {
  constructor (private db: Database) {
  }

  public create (data: IPackageData, done: (err?: Error, result?: IModelPackage) => void) {
    const version = new this.db.models.Package(data);
    const err = version.validateSync();

    if (err) {
      done(err);
      return;
    }

    // @TODO Attempt to convert file from blob to local

    version.save((err, result) => {
      done(err, result);
    });
  }
}
