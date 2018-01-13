import { ModelBase } from '../base/model-base';
import mongoose = require('mongoose');

export class ModelPackageSchema extends ModelBase {
  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {
      version: {
        required: [
          true,
          'Version is required',
        ],
        type: String,
        trim: true,
        match: [
          /^[a-z0-9]+([.-][a-z0-9]+)*$/,
          'Only supports lowercase letters and numbers with optional dashes or period in-between characters.' +
          ' Example "a-0.1.4"',
        ],
      },
      archive: {
        type: String,
        trim: true,
        required: [
          true,
          '`archive` is required',
        ],
      },
      description: {
        type: String,
        trim: true,
      },
    };
  }
}
