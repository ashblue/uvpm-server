import { Router } from 'express';
import { check } from 'express-validator/check';
import { CtrlPackageVersion } from '../../../../../controllers/packages/versions/ctrl-package-version';
import { CtrlUser } from '../../../../../controllers/users/ctrl-user';
import { PermissionType } from '../../../../../controllers/user-roles/roles/e-permission-type';
import { IExpressRequest } from '../../../../../interfaces/i-express-request';

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

      // istanbul ignore if
      if (req.body.description) {
        req.body.description = req.body.description.toString();
      }

      next();
    });

    this.router.post('/:idPackage/versions', this.sanitize, async (req, res, next) => {
      try {
        req.user = await ctrlUser.authenticateUser(PermissionType.CreatePackage, req, res, next);
      } catch (message) {
        res.status(401)
          .json({ message });
        return;
      }

      ctrlVersion.httpAdd(req, res);
    });

    this.router.get('/:idPackage/versions/:idVersion', async (req: IExpressRequest, res, next) => {
      try {
        req.user = await ctrlUser.authenticateUser(PermissionType.GetPackage, req, res, next);
      } catch (message) {
        res.status(401)
          .json({ message });
        return;
      }

      ctrlVersion.httpGet(req, res);
    });

    this.router.delete(`/:idPackage/versions/:idVersion`, async (req: IExpressRequest, res, next) => {
      try {
        req.user = await ctrlUser.authenticateUser(PermissionType.DeletePackage, req, res, next);
      } catch (message) {
        res.status(401)
          .json({ message });
        return;
      }

      ctrlVersion.httpDestroy(req, res);
    });
  }
}
