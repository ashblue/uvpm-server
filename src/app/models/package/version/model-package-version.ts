import { ModelBase } from '../../base/model-base';
import mongoose = require('mongoose');

export class ModelPackageVersionSchema extends ModelBase {
  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {
      name: {
        required: [
          true,
          'Version name is required',
        ],
        type: String,
        trim: true,
        match: [
          /^[a-z0-9]+([.-][a-z0-9]+)*$/,
          'Version name only supports lowercase letters and numbers with optional dashes or period in-between characters.' +
          ' Example "a-0.1.4"',
        ],
      },
      archive: {
        type: String,
        trim: true,
        required: [
          true,
          'Version archive is required',
        ],
      },
      description: {
        type: String,
        trim: true,
      },
    };
  }
}
