import { ModelBase } from './../../base/model-base';

import mongoose = require('mongoose');

export class ModelPackageCollection extends ModelBase {
  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {
      // @TODO Offload this to the base model
      createdAt: {
        type: Date,
        default: Date.now,
      },
      name: {
        type: String,
        required: [true, 'Name is required'],
      },
    };
  }

  constructor () {
    super();

    this.schema.pre('validate', function (this: mongoose.Document, next) {
      // @TODO Offload this to the base model
      if (this.isModified('createdAt')) {
        next(new Error('createdAt cannot be modified'));
        return;
      }

      next();
    });
  }
}
