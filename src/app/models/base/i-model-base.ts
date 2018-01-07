import mongoose = require('mongoose');

export interface IModelBase extends mongoose.Document {
  createdAt: Date;
}
