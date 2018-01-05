import mongoose = require('mongoose');

// @SRC https://gist.github.com/brennanMKE/ee8ea002d305d4539ef6
export interface IModelUser extends mongoose.Document {
  createdAt: Date;
  name: string;
  email: string;
  password; string;
}
