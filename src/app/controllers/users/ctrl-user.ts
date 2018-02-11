import * as express from 'express';
import { userConfig } from './user-config';

import jwt = require('jwt-simple');
import passport = require('passport');
import passportJWT = require('passport-jwt');
import { Database } from '../databases/database';
import { IExpressRequest } from '../../interfaces/i-express-request';
import { IModelUser } from '../../models/user/i-model-user';
import { IUserData } from '../../models/user/i-user-data';

export class CtrlUser {
  constructor (private db: Database) {
    const strategy = new passportJWT.Strategy({
      secretOrKey: userConfig.jwtSecret,
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
    }, (payload, done) => {
      db.models.User.findById(payload.id, (err, user) => {
        // istanbul ignore if
        if (err) {
          return done(err, false);
        }

        // istanbul ignore else
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      });
    });

    passport.use(strategy);
  }

  public httpRegister = (req: express.Request, res: express.Response) => {
    this.register({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        res.status(400)
          .json({ message: err });
      });
  }

  // @TODO Basic happy path test
  public register (user: IUserData): Promise<IModelUser> {
    return new Promise<IModelUser>((resolve, reject) => {
      const userModel = new this.db.models.User(user);

      userModel.save((err, userResult) => {
        if (err) {
          reject(err);
          return;
        }

        // istanbul ignore if
        if (userResult == null) {
          reject('Could not generate user');
          return;
        }

        resolve(userResult);
      });
    });
  }

  public login = (req: express.Request, res: express.Response) => {
    const email = req.body.email;
    const password = req.body.password;

    const userModel = this.db.models.User;
    userModel.findOne({ email, password }, (err, user) => {
      // istanbul ignore if
      if (err) {
        res.status(401).json(err);
        return;
      }

      if (!user) {
        res.status(401).json({
          message: 'Invalid login credentials',
        });
        return;
      }

      const token = jwt.encode({ id: user.id }, userConfig.jwtSecret);
      res.json({
        token,
        user,
      });
    });
  }

  public authenticate = (req: express.Request, res: express.Response, next: express.NextFunction, success: () => void) => {
    passport.authenticate('jwt', userConfig.jwtSession, (err, user, info) => {
      // istanbul ignore if
      if (err) {
        return next(err); // will generate a 500 error
      }

      // Generate a JSON response reflecting authentication status
      if (!user) {
        return res.status(401)
          .json({
            message: 'Authentication failed',
          });
      }

      req['user'] = user;

      success();
    })(req, res, next);
  }

  public update = (req: IExpressRequest, res: express.Response) => {
    const queryId = req.params.userId;

    if (!req.user || req.user.id.toString() !== queryId) {
      res.status(401).json({
        message: 'Access denied',
      });

      return;
    }

    if (req.body.password !== req.body.passwordConfirm) {
      delete req.body.password;

      res.status(400).json({
        errors: {
          password: 'Invalid password update. Requires a matching password and passwordConfirm field',
        },
      });

      return;
    }

    // Always delete password confirmation since it will crash the model update
    delete req.body.passwordConfirm;

    // Assemble the body
    const update: any = {};
    if (req.body.name) {
      update.name = req.body.name;
    }
    if (req.body.email) {
      update.email = req.body.email;
    }
    if (req.body.password) {
      update.password = req.body.password;
    }

    this.db.models.User.findByIdAndUpdate(queryId,
      { $set: req.body },
      {
        runValidators: true,
        new: true,
      },
      (err, record) => {
        if (err) {
          res.status(400).json(err);
          return;
        }

        res.json(record);
      });
  }
}
