import mongoose = require('mongoose');

export abstract class ModelBase {
  public schema: mongoose.Schema;

  protected abstract get schemaDefinition (): mongoose.SchemaDefinition;
  protected get schemaOptions (): mongoose.SchemaOptions {
    return {
      toJSON: {
        transform: (doc, ret) => {
          const id = ret._id;

          delete ret.owner;
          delete ret._id;
          delete ret.__v;

          ret.id = id;
          return ret;
        },
      },
    };
  }

  constructor () {
    this.schema = new mongoose.Schema(this.schemaDefinition, this.schemaOptions);
  }
}
