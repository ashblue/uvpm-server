import { Router } from 'express';
import { check } from 'express-validator/check';
import { CtrlPackageVersion } from '../../../../../controllers/packages/versions/ctrl-package-version';
import { CtrlUser } from '../../../../../controllers/users/ctrl-user';

export class RoutePackageVersions {
  public router = Router();
  private sanitize = [
    check('name')
      .trim()
      .escape(),
  ];

  constructor (public ctrlVersion: CtrlPackageVersion, public ctrlUser: CtrlUser) {
    this.router.use((req, res, next) => {
      if (req.body.name) {
        req.body.name = req.body.name.toString();
      }

      if (req.body.archive) {
        req.body.archive = req.body.archive.toString();
      }

      if (req.body.description) {
        req.body.description = req.body.description.toString();
      }

      next();
    });

    this.router.post('/:idPackage/versions', this.sanitize, (req, res, next) => {
      ctrlUser.authenticate(req, res, next, () => {
        ctrlVersion.httpAdd(req, res);
      });
    });

    this.router.get('/:idPackage/versions/:idVersion', (req, res) => {
      ctrlVersion.httpGet(req, res);
    });

    this.router.delete(`/:idPackage/versions/:idVersion`, (req, res, next) => {
      ctrlUser.authenticate(req, res, next, () => {
        ctrlVersion.httpDestroy(req, res);
      });
    });
  }
}
