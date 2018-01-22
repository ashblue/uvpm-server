import * as mongoose from 'mongoose';
import { IEsSearch } from './i-es-search';

/**
 * Interface for Mongoosastic models that are using the Elastic Search plugin to override normal Mongoose models
 */
export interface IEsModel<T extends mongoose.Document, S>
  extends mongoose.Model<T>, IEsSearch<S> {
  esClient: {
    close: () => void,
  };
}
