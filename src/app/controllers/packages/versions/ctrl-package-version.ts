import { IModelPackageVersion } from '../../../models/package/version/i-model-package-version';
import { Database } from '../../databases/database';
import { IPackageVersionData } from '../../../models/package/version/i-package-version-data';
import { ModelCollection } from '../../databases/model-collection';
import { IModelPackage } from '../../../models/package/i-model-package';
import * as express from 'express';
import { IExpressRequest } from '../../../interfaces/i-express-request';
import * as async from 'async';

/**
 * @TODO File creation and deletion should be offloaded to an inejctable base class
 *       Allows for Google Cloud or local file handling
 */
export class CtrlPackageVersion {
  constructor (private db: Database) {
  }

  /**
   * Clean out versions to prevent potential NoSQL injections
   * @param {[IPackageVersionData]} array
   * @returns {[IPackageVersionData]}
   */
  public sanitizeMany (array: IPackageVersionData[]) {
    const versions: IPackageVersionData[] = [];

    if (!array || !Array.isArray(array)) {
      return [];
    }

    array
      .filter((v) => {
        return v;
      })
      .forEach((v) => {
        versions.push(this.sanitize(v));
      });

    return versions;
  }

  public sanitize (v: IPackageVersionData): IPackageVersionData {
    if (!v) {
      return v;
    }

    const newV: IPackageVersionData = {
      name: v.name,
      archive: v.archive,
    };

    if (newV.name) {
      newV.name = newV.name.toString();
    }

    if (newV.archive) {
      newV.archive = newV.archive.toString();
    }

    if (v.description) {
      newV.description = v.description.toString();
    }

    return newV;
  }

  public createMany (array: IPackageVersionData[]): Promise<IModelPackageVersion[]> {
    return new Promise<IModelPackageVersion[]>((resolve, reject) => {
      const versions = this.sanitizeMany(array);
      this.db.models.PackageVersion.create(versions, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
      });
    });
  }

  public create (data: IPackageVersionData, done: (err?: Error, result?: IModelPackageVersion) => void) {
    const version = new this.db.models.PackageVersion(this.sanitize(data));
    const err = version.validateSync();

    if (err) {
      done(err);
      return;
    }

    version.save((errSave, result) => {
      done(errSave, result);
    });
  }

  public get (packageName: string, versionName: string): Promise<IModelPackageVersion> {
    return new Promise<IModelPackageVersion>((resolve, reject) => {
      this.db.models.Package
        .findOne({ name: packageName })
        .populate([
          {
            path: 'versions',
            model: ModelCollection.PACKAGE_VERSION_ID,
          },
        ])
        .exec((err, res: IModelPackage) => {
          if (err) {
            reject(err);
            return;
          }

          if (!res) {
            reject({ message: `Package ${packageName} could not be found` });
            return;
          }

          const verResult = res.versions.find((v) => v.name === versionName);
          if (!verResult) {
            reject({ message: `Package ${packageName} does not have version ${versionName}` });
            return;
          }

          resolve(verResult);
        });
    });
  }

  public add (packageName: string, data: IPackageVersionData): Promise<IModelPackageVersion> {
    return new Promise<IModelPackageVersion>((resolve, reject) => {
      let pack: IModelPackage;
      let version: IModelPackageVersion;

      async.series([
        (callback) => {
          this.db.models.Package.findOne({
            name: packageName,
          }, (err, res) => {
            if (err) {
              callback(err, undefined);
              return;
            }

            if (!res) {
              callback(`Package ${packageName} could not be found`, undefined);
              return;
            }

            pack = res;
            callback(undefined, undefined);
          });
        },
        (callback) => {
          this.create(data, (err, res) => {
            if (err) {
              callback(err, undefined);
              return;
            }

            if (!res) {
              callback(`Package version details are invalid`, undefined);
              return;
            }

            version = res;
            callback(undefined, undefined);
          });
        },
        (callback) => {
          pack.versions.push(version.id);

          pack.save((err) => {
            if (err) {
              callback(err, undefined);
              return;
            }

            callback(undefined, undefined);
          });
        },
      ], (err) => {
        if (!err) {
          resolve(version);
          return;
        }

        if (version) {
          version.remove((versionRemoveErr) => {
            if (err) {
              console.error(versionRemoveErr);
            }

            reject(err);
          });
        } else {
          reject(err);
        }
      });

    });
  }

  public httpGet = (req: IExpressRequest, res: express.Response) => {
    const idPackage: string = req.params.idPackage;
    const idVersion: string = req.params.idVersion;

    this.get(idPackage, idVersion)
      .then((pack) => {
        res.json(pack);
      })
      .catch((err) => {
        res
          .status(400)
          .json(err);
      });
  }
}
