import * as mongoose from 'mongoose';

export class Database {
  public readonly url: string;

  constructor (url: string, done?: () => void) {
    this.url = url;

    // Do not connect if a connection is already present
    // Prevents tests from starting multiple database instance connections
    if (!mongoose.connection.db) {
      mongoose.connect(this.url);
      this.createLogs();

      mongoose.connection.on('open', () => {
        if (done != null) {
          done();
        }
      });
    } else if (done != null) {
      done();
    }
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
