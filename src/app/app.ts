import * as express from 'express';
import * as http from 'http';
import bodyParser = require('body-parser');
import { Database } from './controllers/databases/database';
import { appConfig } from './helpers/app-config';
import { RouteApi } from './routes/api/api';
import passport = require('passport');
import * as process from 'process';

export class App {
  public db: Database;
  public express: express.Application;
  public port: number;
  public server: http.Server;
  public routes: RouteApi;

  constructor (logs: boolean = false) {
    this.express = express();
    this.express.use(bodyParser.json());
    this.express.use(passport.initialize());

    if (logs) {
      this.express.use(this.logRequest);
    }

    const dbUrl = process.env.TEST === 'true' ? appConfig.DB_TEST_URL : appConfig.DB_DEFAULT_URL;
    this.db = new Database(dbUrl);

    this.routes = new RouteApi(this);
  }

  public createServer (port: number) {
    this.port = port;

    this.server = this.express.listen(port, (err) => {
      if (err) {
        return console.error(err);
      }

      return console.log(`Server is listening on ${port}`);
    });
  }

  private logRequest (req, res, next) {
    console.log('Request', req.originalUrl, req.body);
    next();
  }
}
