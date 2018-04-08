import * as express from 'express';
import { CtrlUser } from '../../../../controllers/users/ctrl-user';
import { check } from 'express-validator/check';
import { NextFunction } from 'express';
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

  constructor (public ctrlUser: CtrlUser) {
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
      async (req: IExpressRequest, res: express.Response, next: NextFunction) => {
        try {
          req.user = await ctrlUser.authenticateUser(PermissionType.CreateUser, req, res, next);
        } catch (message) {
          res.status(401)
            .json({ message });
          return;
        }

        ctrlUser.httpRegister(req, res);
      });

    this.router.put('/:userId', this.sanitize, (req: express.Request, res: express.Response, next: NextFunction) => {
      ctrlUser.authenticate(req, res, next, () => {
        ctrlUser.update(req, res);
      });
    });
  }
}
