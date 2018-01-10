import { ModelBase } from '../../base/model-base';

import mongoose = require('mongoose');
import { Schema } from 'mongoose';
import { ModelCollection } from '../../../controllers/databases/model-collection';

export class ModelPackageCollectionSchema extends ModelBase {
  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {
      owner: {
        type: Schema.Types.ObjectId,
        ref: ModelCollection.USER_ID,
        required: [true, 'Owner is required'],
      },

      name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        unique: true,
        // Regex interactive debuggging https://regex101.com/r/4UhVvb/3
        match: [
          /^[a-z0-9]+(-[a-z0-9]+)*$/,
          'Names can only contain lowercase letters with numbers. Dashes must be between characters. Example "my-package-2017"',
        ],
      },

      packages: {
        type: [Schema.Types.ObjectId],
        ref: ModelCollection.PACKAGE_ID,
        validate: {
          validator: (array) => {
            return array && array.length !== 0;
          },
          message: '`packages` requires at least one package to initialize',
        },
      },
    };
  }

  protected onValidate (document: mongoose.Document, next): boolean {
    if (!document.isNew && document.isModified('name')) {
      next(new Error('name cannot be modified'));
      return true;
    }

    return false;
  }
}
