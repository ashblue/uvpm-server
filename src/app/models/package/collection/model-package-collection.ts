import { ModelBase } from '../../base/model-base';

import mongoose = require('mongoose');

export class ModelPackageCollectionSchema extends ModelBase {
  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {
      name: {
        type: String,
        required: [true, 'Name is required'],
      },
    };
  }
}
