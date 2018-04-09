import * as express from 'express';
import { IExpressRequest } from '../../interfaces/i-express-request';
import * as async from 'async';
import { Database } from '../databases/database';
import { CtrlPackageVersion } from './versions/ctrl-package-version';
import { IModelPackage } from '../../models/package/i-model-package';
import { ModelCollection } from '../databases/model-collection';
import { IModelUser } from '../../models/user/i-model-user';
import { IPackageData } from '../../models/package/i-package-data';
import { IModelPackageVersion } from '../../models/package/version/i-model-package-version';
import { IPackageSearchResult } from '../../models/package/i-package-search-result';
import { CtrlUserRoles } from '../user-roles/ctrl-user-roles';
import { PermissionType } from '../user-roles/roles/e-permission-type';
import { RoleType } from '../user-roles/roles/e-role-type';

/**
 * @TODO Decouple from logic in versions
 */
export class CtrlPackage {
  public versions: CtrlPackageVersion;

  constructor (private db: Database, private ctrlUserRoles: CtrlUserRoles) {
    this.versions = new CtrlPackageVersion(this.db, this.ctrlUserRoles);
  }

  public httpCreate = (req: IExpressRequest, res: express.Response) => {
    const user = req.user as IModelUser;
    const packRaw: IPackageData = req.body;
    const pack: IPackageData = {
      name: packRaw.name,
      versions: packRaw.versions,
      author: user.id,
    };

    if (!pack.name) {
      res.status(400)
        .json({ message: 'Package name is required' });
      return;
    }

    // istanbul ignore if
    if (!user) {
      res.status(401)
        .json({ message: 'Authentication is required' });
      return;
    }

    this.db.models.Package.findOne({ name: pack.name }, (err, result) => {
      if (err) {
        res.status(400)
          .json(err);
        return;
      }

      if (!result) {
        this.create(pack)
          .then((result2) => {
            res.json(result2);
          })
          .catch((err2) => {
            res.status(400)
              .json(err2);
          });
      } else {
        res.status(400)
          .json({ message: 'Could not create. Name already in use. Please choose another' });
      }
    });
  }

  public httpGet = (req: IExpressRequest, res: express.Response) => {
    const id: string = req.params.idPackage;

    this.get(id)
      .then((pack) => {
        if (pack == null) {
          res.status(400)
            .json({
              message: `Could not find the requested package ID ${id}`,
            });
          return;
        }

        res.json(pack);
      })
      .catch((err) => {
        res
          .status(400)
          .json(err);
      });
  }

  public httpSearch = (req: IExpressRequest, res: express.Response) => {
    const name: string = req.params.packageName;

    this.search(name)
      .then((results) => {
        if (!results) {
          res.json([]);
          return;
        }

        res.json(results);
      })
      .catch((err) => {
        res.json([]);
      });
  }

  public httpDestroy = (req: IExpressRequest, res: express.Response) => {
    const user = req.user as IModelUser;
    const packName: string = req.params.idPackage;

    // istanbul ignore if
    if (!user || !this.ctrlUserRoles.hasPermission(user.role as RoleType, PermissionType.DeleteOwnPackages)) {
      res.status(401)
        .json({ message: 'Authentication failed' });
      return;
    }

    this.get(packName)
      .then((pack) => {
        if (!this.ctrlUserRoles.hasPermission(user.role as RoleType, PermissionType.DeleteOtherPackages)
          && pack.author.id !== user.id) {
          res.status(401)
            .json({ message: 'You cannot delete this package' });
          return;
        }

        this.destroy(packName)
          .then(() => {
            res.json({ message: `Successfully removed package ${packName}` });
          })
          .catch((err) => {
            res.status(400)
              .json(err);
          });
      })
      // @TODO A test should be written for this
      .catch(/* istanbul ignore next */ (err) => {
        // istanbul ignore next
        res.status(400)
          .json({ message: `Could not find package ID ${packName}` });
      });
  }

  /**
   * Create a package and attach a corresponding user
   * @param {IPackageData} pack
   * @param {IModelUser} user
   * @returns {Promise<IModelPackage>}
   */
  public create (pack: IPackageData): Promise<IModelPackage> {
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
          if (pack.author && typeof pack.author !== 'string' && pack.author.id) {
            pack.author = pack.author.id;
          }

          const newPack = new this.db.models.Package({
            name: pack.name,
            author: pack.author,
            versions,
          });

          newPack.save((err, result) => {
            savedPack = result;

            // istanbul ignore next: Helps identify production Elastic Search issues
            newPack.on('es-indexed', (errEs) => {
              if (errEs) {
                console.error('es-indexed error:');
                console.error(errEs);
              }
            });

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
            // istanbul ignore if
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

        // istanbul ignore if: Should write a test at a later date
        if (savedPack) {
          this.db.models.Package.findByIdAndRemove(savedPack, (errVersion) => {
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
            // istanbul ignore if
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

  /**
   * Get a package by its unique name
   * @param {string} name
   */
  public get (name: string): Promise<IModelPackage> {
    return new Promise<IModelPackage>((resolve, reject) => {
      this.db.models.Package
        .findOne({ name })
        .populate([
          {
            path: 'versions',
            model: ModelCollection.PACKAGE_VERSION_ID,
            options: {
              sort: {
                name: -1,
              },
            },
          },
          {
            path: 'author',
          },
        ])
        .exec((err, res: IModelPackage) => {
          // istanbul ignore if
          if (err) {
            reject(err);
            return;
          }

          resolve(res);
        });
    });
  }

  /**
   * Retrieve search results for a specific package
   * @param {string} name
   * @returns {Promise<IPackageSearchResult[]>}
   */
  public search (name: string): Promise<IPackageSearchResult[]> {
    return new Promise<IPackageSearchResult[]>((resolve, reject) => {
      this.db.models.Package.search({
        match: {
          name: {
            query: name,
            fuzziness: 2,
          },
        },
      }, (errEs, results) => {
        if (errEs) {
          reject(errEs);
          return;
        }

        // istanbul ignore if
        if (!results || !results.hits.hits || results.hits.hits.length === 0) {
          resolve([]);
          return;
        }

        const packageNameToScore = results.hits.hits.reduce((result, obj) => {
          result[obj._source.name] = obj._score;
          return result;
        }, {});

        results.hits.hits.reduce((map, obj) => {
          return map;
        });

        const packageNames = results.hits.hits.map((h) => h._source.name);
        this.db.models.Package
          .find({ name: packageNames })
          .populate([
            {
              path: 'versions',
              model: ModelCollection.PACKAGE_VERSION_ID,
              options: {
                sort: {
                  name: -1,
                },
              },
            },
            {
              path: 'author',
            },
          ])
          .exec((err, res) => {
            // istanbul ignore if
            if (err) {
              reject(err);
              return;
            }

            const searchResults: IPackageSearchResult[] = res
              .sort((a, b) => {
                return packageNameToScore[b.name] - packageNameToScore[a.name];
              })
              .map((p) => {
              return {
                name: p.name,
                description: p.versions[0].description as string,
                author: p.author.name,
                date: p.versions[0].createdAt,
                version: p.versions[0].name,
              };
            });

            resolve(searchResults);
          });
      });
    });
  }

  /**
   * Remove a package by name with all associated version data
   * @param {string} name
   * @returns {Promise}
   */
  public destroy (name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.models.Package.findOne({ name }, (err, res) => {
        // istanbul ignore if
        if (err) {
          reject(err);
          return;
        }

        if (!res) {
          reject({ message: `Could not find package ID ${name}` });
          return;
        }

        res.remove((errRemove) => {
          // istanbul ignore if
          if (errRemove) {
            reject(errRemove);
            return;
          }

          resolve();
        });
      });
    });
  }
}
