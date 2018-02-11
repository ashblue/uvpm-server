import * as mongoose from 'mongoose';
import { ModelCollection } from './model-collection';

export class Database {
  public readonly connection: mongoose.Connection;
  public readonly url: string;
  private modelsCache: ModelCollection;

  /**
   * Lazy loads a collection of models when called for the first time
   * @returns {ModelCollection}
   */
  public get models (): ModelCollection {
    if (this.modelsCache !== undefined) {
      return this.modelsCache;
    }

    this.modelsCache = new ModelCollection(this);

    return this.modelsCache;
  }

  constructor (url: string, done?: (db: Database) => void) {
    this.url = url;

    this.connection = mongoose.createConnection(this.url);
    this.connection.once('open', () => {
      if (done != null) {
        done(this);
      }
    });
  }

  public closeConnection (done: () => void) {
    this.connection.close(done);
  }
}
