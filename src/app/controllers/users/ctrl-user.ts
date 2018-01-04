import * as express from 'express';
import {userConfig} from './user-config';

import jwt = require('jwt-simple');
import passport = require('passport');
import passportJWT = require('passport-jwt');
import {Database} from '../databases/database';

export class CtrlUser {
  constructor (private db: Database) {
    const strategy = new passportJWT.Strategy({
      secretOrKey: userConfig.jwtSecret,
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
    }, (payload, done) => {
      db.models.User.findById(payload.id, (err, user) => {
        if (err) {
          return done(err, false);
        }

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      });
    });

    passport.use(strategy);
  }

  public register (req: express.Request, res: express.Response) {
    const user = new this.db.models.User(req.body);
    user.save((err, user) => {
      if (err) {
        res.status(500).json(err);
        return;
      }

      if (user == null) {
        res.status(500).json({message: 'Could not generate user'});
        return;
      }

      res.json(user);
    });
  }

  public login (req: express.Request, res: express.Response) {
    const email = req.body.email;
    const password = req.body.password;

    const user = this.db.models.User;
    user.findOne({email, password}, (err, user) => {
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

      const token = jwt.encode({id: user.id}, userConfig.jwtSecret);
      res.json({
        token,
        user,
      });
    });
  }

  public authenticate () {
    return passport.authenticate('jwt', userConfig.jwtSession);
  }

  public update (req: express.Request, res: express.Response) {
    // Handle bulk details update
    // Handle password with confirm field
  }
}
