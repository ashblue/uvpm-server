import * as mongoose from 'mongoose';

export class Database {
  public readonly connection: mongoose.Connection;
  public readonly url: string;

  constructor (url: string, done?: (db: Database) => void) {
    this.url = url;

    this.connection = mongoose.createConnection(this.url);
    this.connection.once('open', () => {
      this.createLogs();

      if (done != null) {
        done(this);
      }
    });
  }

  public closeConnection (done: () => void) {
    this.connection.close(done);
  }

  private createLogs () {
    mongoose.connection.on('open', () => {
      console.log(`Successfully connected to MongoDB: ${this.url}`);
    });

    mongoose.connection.on('close', () => {
      console.log(`Closed connection to MongoDB: ${this.url}`);
    });
  }
}
