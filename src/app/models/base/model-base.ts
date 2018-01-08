import mongoose = require('mongoose');
import * as _ from 'lodash';

export abstract class ModelBase {
  public schema: mongoose.Schema;

  protected abstract get schemaDefinition (): mongoose.SchemaDefinition;
  private get schemaDefinitionDefault (): mongoose.SchemaDefinition {
    return {
      createdAt: {
        type: Date,
        default: Date.now,
      },
    };
  }

  protected get schemaOptions (): mongoose.SchemaDefinition {
    return {
      toJSON: {
        transform: this.transform,
      },
    };
  }

  constructor () {
    this.schema = new mongoose.Schema(this.getSchemaDefinition(), this.schemaOptions);

    const self = this;
    this.schema.pre('validate', function (this: mongoose.Document, next) {
      if (this.isModified('createdAt')) {
        next(new Error('createdAt cannot be modified'));
        return;
      }

      if (self.onValidate(this, next)) {
        return;
      }

      next();
    });
  }

  public getSchemaDefinition (): mongoose.SchemaDefinition {
    const schema = {};
    _.merge(schema, this.schemaDefinitionDefault);
    _.merge(schema, this.schemaDefinition);

    return schema;
  }

  /**
   * Handle JSON output of this model when exported
   * @param doc
   * @param ret
   * @returns {any}
   */
  protected transform (doc, ret) {
    const id = ret._id;

    delete ret.owner;
    delete ret._id;
    delete ret.__v;

    ret.id = id;

    return ret;
  }

  /**
   * Return true if an error was fired
   * @param {"mongoose".Document} document
   * @param next
   * @returns {boolean}
   */
  protected onValidate (document: mongoose.Document, next): boolean {
    return false;
  }
}
