import { ModelBase } from './../base/model-base';

import mongoose = require('mongoose');

// @SRC https://gist.github.com/brennanMKE/ee8ea002d305d4539ef6
export interface IModelUser extends mongoose.Document {
  createdAt: Date;
  name: string;
  email: string;
  password; string;
}

export class ModelUserSchema extends ModelBase {
  get schemaOptions (): mongoose.SchemaOptions {
    return {
      toJSON: {
        transform: (doc, ret) => {
          // Hide all sensitive data from the API end point
          ret.id = ret._id;
          delete ret._id;
          delete ret.password;

          return ret;
        },
      },
    };
  }

  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {
      createdAt: {
        type: Date,
        default: Date.now,
      },
      name: {
        type: String,
        required: [true, 'Name is required'],
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        validate: [
          {
            message: 'Please provide a valid email',
            validator: (email) => {
              return new Promise((resolve, reject) => {
                const regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                resolve(regex.test(email));
              });
            },
          },
        ],
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        validate: [
          {
            message: 'Must have at least one letter',
            validator: (password) => {
              return new Promise((resolve, reject) => {
                const regex = /[a-z]/i;
                resolve(regex.test(password));
              });
            },
          },
          {
            message: 'Must have at least one number',
            validator: (password) => {
              return new Promise((resolve, reject) => {
                const regex = /\d+/g;
                resolve(regex.test(password));
              });
            },
          },
        ],
      },
    };
  }

  constructor () {
    super();

    this.schema.pre('validate', function (this: mongoose.Document, next) {
      if (this.isModified('createdAt')) {
        next(new Error('createdAt cannot be modified'));
        return;
      }

      next();
    });
  }
}
