import * as express from 'express';
import { CtrlUser } from '../../../../controllers/users/ctrl-user';
import { check } from 'express-validator/check';
import { NextFunction } from 'express';
import { CtrlUserRoles } from '../../../../controllers/user-roles/ctrl-user-roles';
import { PermissionType } from '../../../../controllers/user-roles/roles/e-permission-type';
import { IExpressRequest } from '../../../../interfaces/i-express-request';

export class RouteUsers {
  public router = express.Router();
  private sanitize = [
    check('name')
      .trim()
      .escape(),
    check('email')
      .normalizeEmail()
      .trim()
      .escape(),
    check('password')
      .trim()
      .escape(),
    check('passwordConfirm')
      .trim()
      .escape(),
  ];

  constructor (public ctrlUser: CtrlUser, private ctrlUserRoles: CtrlUserRoles) {
    this.ctrlUserRoles = new CtrlUserRoles();

    // Cast body to proper values to prevent NoSQL injections
    this.router.use((req, res, next) => {
      if (req.body.name) {
        req.body.name = req.body.name.toString();
      }

      if (req.body.email) {
        req.body.email = req.body.email.toString();
      }

      if (req.body.password) {
        req.body.password = req.body.password.toString();
      }

      // istanbul ignore if
      if (req.body.passwordConfirm) {
        req.body.passwordConfirm = req.body.passwordConfirm.toString();
      }

      next();
    });

    this.router.post('/login', this.sanitize, ctrlUser.loginHttp);

    this.router.post('/', this.sanitize,
      (req: IExpressRequest, res: express.Response, next: NextFunction) => {
        ctrlUser.authenticate(req, res, next, () => {
          if (req.user && req.user.role !== undefined
            && this.ctrlUserRoles.hasPermission(req.user.role, PermissionType.CreateUser)) {
            ctrlUser.httpRegister(req, res);
            return;
          }

          res.status(401)
            .json({
              message: 'You do not have the permission to do that',
            });
        });
      });

    this.router.put('/:userId', this.sanitize, (req: express.Request, res: express.Response, next: NextFunction) => {
      ctrlUser.authenticate(req, res, next, () => {
        ctrlUser.update(req, res);
      });
    });
  }
}
