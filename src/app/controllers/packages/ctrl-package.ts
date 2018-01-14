import * as express from 'express';
import { IExpressRequest } from '../../helpers/interfaces/i-express-request';
import * as async from 'async';
import { Database } from '../databases/database';
import { CtrlPackageVersion } from './versions/ctrl-package-version';
import { IModelPackage } from '../../models/package/i-model-package';
import { IModelPackageCollection } from '../../models/package/collection/i-model-package-collection';
import { ModelCollection } from '../databases/model-collection';

export class CtrlPackage {
  private versions: CtrlPackageVersion;

  constructor (private db: Database) {
    this.versions = new CtrlPackageVersion(this.db);
  }

  public create = (req: IExpressRequest, res: express.Response) => {
    const user = req.user;

    if (!user) {
      res.status(400)
        .json({ message: 'Authentication is required' });
      return;
    }

    // Trigger this early to prevent accidentally creating a new file from the data
    if (!req.body.name) {
      res.status(400)
        .json({ message: 'Name is required' });
    }

    let version: IModelPackage;
    let pack: IModelPackageCollection;

    async.series([
      (callback) => {
        // Verify name isn't already taken
        this.db.models.PackageCollection.findOne({ name: req.body.name }, (err, result) => {
          if (err) {
            callback(err);
            return;
          }

          if (!result) {
            callback(undefined);
          } else {
            callback({ message: 'Name already in use. Please choose another' });
          }
        });
      },
      (callback) => {
        // Verify version can be created
        this.versions.create({
          version: req.body.version,
          archive: req.body.archive,
          description: req.body.description,
        }, (err, result) => {
          if (result) {
            version = result;
          }

          callback(err);
        });
      },
      (callback) => {
        // Verify package can be created
        const newPack = new this.db.models.PackageCollection({
          name: req.body.name,
          author: user.id,
          packages: [version.id],
        });

        newPack.save((err, result) => {
          pack = result;
          callback(err);
        });
      },
      (callback) => {
        pack.populate([
          {
            path: 'packages',
            model: ModelCollection.PACKAGE_ID,
          },
          {
            path: 'author',
          },
        ], (err, result) => {
          if (err) {
            callback(err);
            return;
          }

          res.json(result);
          callback(undefined);
        });
      },
    ], (err) => {
      if (!err) {
        return;
      }

      // Run data cleanup to prevent object leaks in the database
      async.series([
        (callback) => {
          if (!version) {
            callback();
            return;
          }

          this.db.models.Package.findByIdAndRemove(version, (errPack) => {
            callback(errPack);
          });
        },
        (callback) => {
          if (!pack) {
            callback();
            return;
          }

          this.db.models.PackageCollection.findByIdAndRemove(pack, (errVersion) => {
            callback(errVersion);
          });
        },
      ], (errFinal) => {
        if (errFinal) {
          console.error(errFinal);
        }

        res.status(400)
          .json(err);
      });
    });
  }
}
