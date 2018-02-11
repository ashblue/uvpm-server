import * as express from 'express';
import * as http from 'http';
import bodyParser = require('body-parser');
import { Database } from './controllers/databases/database';
import { appConfig } from './helpers/app-config';
import { RouteApi } from './routes/api/api';
import passport = require('passport');
import * as fs from 'fs';

export class App {
  public db: Database;
  public express: express.Application;
  public port: number;
  public server: http.Server;
  public routes: RouteApi;

  constructor (logs: boolean = false) {
    this.express = express();
    this.express.use(bodyParser.json({ limit: '10mb' }));
    this.express.use(passport.initialize());

    this.setupFileFolder();

    if (logs) {
      this.express.use(this.logRequest);
    }

    this.db = new Database(appConfig.dbUrl);
    this.routes = new RouteApi(this);
  }

  public createServer (port: number, done?: (err: Error) => void) {
    this.port = port;

    this.server = this.express.listen(port, (err: Error) => {
      if (err) {
        console.error(err);
      }

      // istanbul ignore else
      if (done) {
        done(err);
      }

      return console.log(`Server is listening on ${port}`);
    });
  }

  private setupFileFolder () {
    const fileFolder = `${appConfig.PUBLIC_FOLDER}/${appConfig.fileFolder}`;
    if (!fs.existsSync(fileFolder)) {
      fs.mkdirSync(fileFolder);
    }

    this.express.use(express.static(appConfig.PUBLIC_FOLDER));
  }

  // istanbul ignore next
  private logRequest (req: any, res: Express.Response, next: any) {
    console.log('Request', req.originalUrl, req.body);
    next();
  }
}
