import { ModelBase } from '../base/model-base';
import mongoose = require('mongoose');

export class ModelPackageSchema extends ModelBase {
  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {
    };
  }
}
