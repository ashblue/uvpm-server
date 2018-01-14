import mongoose = require('mongoose');

import { ModelBase } from '../base/model-base';
import { Schema } from 'mongoose';
import { ModelCollection } from '../../controllers/databases/model-collection';
import { IModelPackageVersion } from './version/i-model-package-version';

export class ModelPackageSchema extends ModelBase {
  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {
      author: {
        type: Schema.Types.ObjectId,
        ref: ModelCollection.USER_ID,
        required: [true, 'Author is required'],
      },

      name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        unique: true,
        // Regex interactive debuggging https://regex101.com/r/4UhVvb/3
        match: [
          /^[a-z0-9]+(-[a-z0-9]+)*$/,
          'Package name can only contain lowercase letters with numbers. Dashes must be between characters.' +
          ' Example "my-package-2017"',
        ],
      },

      versions: {
        type: [Schema.Types.ObjectId],
        ref: ModelCollection.PACKAGE_VERSION_ID,
        validate: {
          isAsync: true,
          validator: (array, success) => {
            const packageIds = array.map((id) => mongoose.Types.ObjectId(id));
            const pack = this.connection.model(ModelCollection.PACKAGE_VERSION_ID);
            pack.find({
              _id: {
                $in: packageIds,
              },
            }, (err, docs: [IModelPackageVersion]) => {
              if (err) {
                console.error(err);
                success(false);
                return;
              }

              const ids: any = {};
              for (const doc of docs) {
                if (ids[doc.name]) {
                  success(false);
                  return;
                }

                ids[doc.name] = true;
              }

              success(array && array.length !== 0);
            });
          },
          message: '`versions` require at least one version to initialize and additional versions must have a unique name',
        },
      },
    };
  }

  constructor (private connection: mongoose.Connection) {
    super();
  }

  protected onValidate (document: mongoose.Document, next): boolean {
    if (!document.isNew && document.isModified('name')) {
      next(new Error('name cannot be modified'));
      return true;
    }

    return false;
  }
}