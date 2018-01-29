import { ModelBase } from './../base/model-base';

import mongoose = require('mongoose');

export class ModelUserSchema extends ModelBase {
  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {
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

  protected transform (doc, ret) {
    delete ret.password;

    return super.transform(doc, ret);
  }
}
