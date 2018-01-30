import * as express from 'express';
import { CtrlUser } from '../../../../controllers/users/ctrl-user';
import { check } from 'express-validator/check';
import { NextFunction } from 'express';

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

      if (req.body.passwordConfirm) {
        req.body.passwordConfirm = req.body.passwordConfirm.toString();
      }

      next();
    });

    this.router.post('/login', this.sanitize, ctrlUser.login);
    this.router.post('/', this.sanitize, ctrlUser.httpRegister);
    this.router.put('/:userId', this.sanitize, (req: express.Request, res: express.Response, next: NextFunction) => {
      ctrlUser.authenticate(req, res, next, () => {
        ctrlUser.update(req, res);
      });
    });
  }
}
