import * as express from 'express';
import * as http from 'http';
import bodyParser = require('body-parser');
import { Database } from './controllers/databases/database';
import { appConfig } from './helpers/app-config';

export class App {
  public db: Database;
  public express: express.Application;
  public port: number;
  public server: http.Server;

  constructor (logs: boolean = false) {
    this.express = express();
    this.express.use(bodyParser.json());

    if (logs) {
      this.express.use(this.logRequest);
    }

    // @TODO Should eat an overridable environmental variable if set (include test)
    this.db = new Database(appConfig.DB_DEFAULT_URL);
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
