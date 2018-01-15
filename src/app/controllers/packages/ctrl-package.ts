import * as express from 'express';
import { IExpressRequest } from '../../helpers/interfaces/i-express-request';
import * as async from 'async';
import { Database } from '../databases/database';
import { CtrlPackageVersion } from './versions/ctrl-package-version';
import { IModelPackage } from '../../models/package/i-model-package';
import { ModelCollection } from '../databases/model-collection';
import { IModelUser } from '../../models/user/i-model-user';
import { IPackageData } from '../../models/package/i-package-data';
import { IModelPackageVersion } from '../../models/package/version/i-model-package-version';

export class CtrlPackage {
  private versions: CtrlPackageVersion;

  constructor (private db: Database) {
    this.versions = new CtrlPackageVersion(this.db);
  }

  public httpPost = (req: IExpressRequest, res: express.Response) => {
    const pack: IPackageData = req.body;
    const user = req.user as IModelUser;

    if (!pack.name) {
      res.status(400)
        .json({ message: 'Package name is required' });
      return;
    }

    if (!user) {
      res.status(401)
        .json({ message: 'Authentication is required' });
      return;
    }

    this.db.models.PackageCollection.findOne({ name: pack.name }, (err, result) => {
      if (err) {
        res.status(400)
          .json(err);
        return;
      }

      if (!result) {
        this.create(pack, user)
          .then((result) => {
            res.json(result);
          })
          .catch((err) => {
            res.status(400)
              .json(err);
          });
      } else {
        res.status(400)
          .json({ message: 'Could not create. Name already in use. Please choose another' });
      }
    });
  }

  public create (pack: IPackageData, user: IModelUser): Promise<IModelPackage> {
    return new Promise<IModelPackage>((resolve, reject) => {
      // Convert all package data to versions
      let versions: IModelPackageVersion[];
      let savedPack: IModelPackage;

      async.series([
        (callback) => {
          this.versions.createMany(pack.versions)
            .then((results) => {
              versions = results;
              callback(undefined);
            })
            .catch((err) => {
              callback(err);
            });
        },
        (callback) => {
          // Verify package can be created
          const newPack = new this.db.models.PackageCollection({
            name: pack.name,
            author: user.id,
            versions,
          });

          newPack.save((err, result) => {
            savedPack = result;
            callback(err);
          });
        },
        (callback) => {
          savedPack.populate([
            {
              path: 'versions',
              model: ModelCollection.PACKAGE_VERSION_ID,
            },
            {
              path: 'author',
            },
          ], (err, result) => {
            if (err) {
              callback(err);
              return;
            }

            resolve(result);
            callback(undefined);
          });
        },
      ], (err) => {
        if (!err) {
          return;
        }

        if (savedPack) {
          this.db.models.PackageCollection.findByIdAndRemove(savedPack, (errVersion) => {
            if (errVersion) {
              console.error(errVersion);
            }

            reject(err);
          });
        } else if (versions) {
          const versionIds = versions.map((v) => v._id);
          this.db.models.PackageVersion.remove({
            _id: { $in: versionIds },
          }, (err2) => {
            if (err2) {
              console.error(err2);
            }

            reject(err);
          });
        } else {
          reject(err);
        }
      });
    });
  }
}
