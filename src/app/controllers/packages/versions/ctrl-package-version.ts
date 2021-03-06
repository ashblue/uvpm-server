import { IModelPackageVersion } from '../../../models/package/version/i-model-package-version';
import { Database } from '../../databases/database';
import { IPackageVersionData } from '../../../models/package/version/i-package-version-data';
import { ModelCollection } from '../../databases/model-collection';
import { IModelPackage } from '../../../models/package/i-model-package';
import * as express from 'express';
import { IExpressRequest } from '../../../interfaces/i-express-request';
import * as async from 'async';
import { IModelUser } from '../../../models/user/i-model-user';
import { CtrlUserRoles } from '../../user-roles/ctrl-user-roles';
import { PermissionType } from '../../user-roles/roles/e-permission-type';
import { RoleType } from '../../user-roles/roles/e-role-type';

/**
 * @TODO File creation and deletion should be offloaded to an inejctable base class
 *       Allows for Google Cloud or local file handling
 */
export class CtrlPackageVersion {
  constructor (private db: Database, private ctrlUserRoles: CtrlUserRoles) {
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
          // istanbul ignore if
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

  public destroy (packageName: string, versionName: string): Promise<void> {
    let version: IModelPackageVersion;

    return new Promise<void>((resolve, reject) => {
      async.series([
        (callback) => {
          this.db.models.Package.findOne({ name: packageName })
            .then((result) => {
              if (result && result.versions.length <= 1) {
                callback(`You cannot remove the last version on a package.
                Please add another version or destroy the package itself`);
                return;
              }

              callback();
            })
            .catch((err) => {
              callback(err);
            });
        },
        (callback) => {
          this.get(packageName, versionName)
            .then((result) => {
              version = result;
              callback();
            })
            .catch((err) => {
              callback(err);
            });
        },
        (callback) => {
          version.remove((err) => {
            callback(err);
          });
        },
      ], (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
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
            // istanbul ignore if
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

            // istanbul ignore if
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
            // istanbul ignore if
            if (versionRemoveErr) {
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

  public httpAdd = (req: IExpressRequest, res: express.Response) => {
    const idPackage: string = req.params.idPackage;
    const data: IPackageVersionData = req.body;
    const user = req.user as IModelUser;

    if (!user || !this.ctrlUserRoles.hasPermission(user.role as RoleType, PermissionType.CreateOwnPackage)) {
      res.status(401)
        .json({ message: 'You are not authorized to create packages' });
      return;
    }

    async.series([
      (callback) => {
        this.db.models.Package
          .findOne({ name: idPackage })
          .populate('author')
          .exec((errPack, pack) => {
            // istanbul ignore if
            if (errPack) {
              callback(errPack);
              return;
            }

            if (!pack) {
              callback(`Requested package ${idPackage} does not exist`);
              return;
            }

            if (pack.author.id !== user.id &&
              !this.ctrlUserRoles.hasPermission(user.role as RoleType, PermissionType.CreateOtherPackage)) {
              callback(`You are not authorized to do that`);
              return;
            }

            callback(undefined, undefined);
          });
      },
      (callback) => {
        this.add(idPackage, data)
          .then((version) => {
            res.json(version);
            callback(undefined, undefined);
          })
          .catch(/* istanbul ignore next */ (err) => {
            callback(err);
          });
      },
    ], ((err) => {
      if (err === 'You are not authorized to do that') {
        res.status(401)
          .json({ message: err });
      } else if (err) {
        res.status(400)
          .json({ message: err });
      }
    }));
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

  public httpDestroy = (req: IExpressRequest, res: express.Response) => {
    const packName: string = req.params.idPackage;
    const versionName: string = req.params.idVersion;
    const user = req.user;

    // istanbul ignore if
    if (!user || !this.ctrlUserRoles.hasPermission(user.role as RoleType, PermissionType.DeleteOwnPackages)) {
      res.status(401)
        .json({ message: 'Authentication failed' });
      return;
    }

    async.series([
      (callback) => {
        this.db.models.Package.findOne({ name: packName })
          .populate('author')
          .then((pack) => {
            if (pack
              && pack.author.id !== user.id
              && !this.ctrlUserRoles.hasPermission(user.role as RoleType, PermissionType.DeleteOtherPackages)) {
              callback('You are not the package author');
              return;
            }

            callback();
          });
      },
      (callback) => {
        this.destroy(packName, versionName)
          .then(() => callback())
          .catch((err) => callback(err));
      },
    ], (err, results) => {
      if (err === 'You are not the package author') {
        res.status(401)
          .json({ message: err });
        return;
      } else if (err) {
        res.status(400)
          .json({ message: err });
        return;
      }

      res.json({ message: 'Package removed' });
    });
  }
}
