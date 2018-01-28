import { Router } from 'express';
import { check } from 'express-validator/check';
import { CtrlPackage } from '../../../../controllers/packages/ctrl-package';
import { CtrlUser } from '../../../../controllers/users/ctrl-user';

export class RoutePackages {
  public router = Router();
  private sanitize = [
    check('name')
      .trim()
      .escape(),
  ];

  constructor (public ctrlPackage: CtrlPackage, public ctrlUser: CtrlUser) {
    this.router.use((req, res, next) => {
      if (req.body.name) {
        req.body.name = req.body.name.toString();
      }

      if (req.body.versions) {
        req.body.versions = ctrlPackage.versions.sanitizeMany(req.body.versions);
      }

      next();
    });

    this.router.post('/', this.sanitize, (req, res, next) => {
      ctrlUser.authenticate(req, res, next, () => {
        ctrlPackage.httpCreate(req, res);
      });
    });

    this.router.get('/:idPackage', (req, res) => {
      ctrlPackage.httpGet(req, res);
    });

    this.router.delete(`/:idPackage`, (req, res, next) => {
      ctrlUser.authenticate(req, res, next, () => {
        ctrlPackage.httpDestroy(req, res);
      });
    });

    this.router.get(`/search/:packageName`, (req, res) => {
      ctrlPackage.httpSearch(req, res);
    });
  }
}
