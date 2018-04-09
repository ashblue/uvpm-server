import { Router } from 'express';
import { check } from 'express-validator/check';
import { CtrlPackage } from '../../../../controllers/packages/ctrl-package';
import { CtrlUser } from '../../../../controllers/users/ctrl-user';
import { PermissionType } from '../../../../controllers/user-roles/roles/e-permission-type';
import { IExpressRequest } from '../../../../interfaces/i-express-request';

/**
 * @TODO Simply pass through to the http methods with authentication, allow them to determine if
 * a user is required or not. Should not fail immediately if there is no user (logic here is getting too complex)
 */
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

    this.router.post('/', this.sanitize, async (req, res, next) => {
      try {
        req.user = await ctrlUser.authenticateUser(PermissionType.CreateOwnPackage, req, res, next);
      } catch (message) {
        res.status(401)
          .json({ message });
        return;
      }

      ctrlPackage.httpCreate(req, res);
    });

    this.router.get('/:idPackage', async (req: IExpressRequest, res, next) => {
      try {
        req.user = await ctrlUser.authenticateUser(PermissionType.GetPackage, req, res, next);
      } catch (message) {
        res.status(401)
          .json({ message });
        return;
      }

      ctrlPackage.httpGet(req, res);
    });

    this.router.delete(`/:idPackage`, async (req: IExpressRequest, res, next) => {
      try {
        req.user = await ctrlUser.authenticateUser(PermissionType.DeleteOwnPackages, req, res, next);
      } catch (message) {
        res.status(401)
          .json({ message });
        return;
      }

      ctrlPackage.httpDestroy(req, res);
    });

    this.router.get(`/search/:packageName`, async (req: IExpressRequest, res, next) => {
      try {
        req.user = await ctrlUser.authenticateUser(PermissionType.SearchPackages, req, res, next);
      } catch (message) {
        res.status(401)
          .json({ message });
        return;
      }

      ctrlPackage.httpSearch(req, res);
    });
  }
}
