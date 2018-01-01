import * as express from 'express';
import * as http from 'http';
import bodyParser = require('body-parser');

export class App {
  public express: express.Application;
  public port: number;
  public server: http.Server;

  constructor (logs: boolean = false) {
    this.express = express();
    this.express.use(bodyParser.json());

    if (logs) {
      this.express.use(this.logRequest);
    }
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
