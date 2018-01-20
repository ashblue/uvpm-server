import { ModelBase } from '../../base/model-base';
import mongoose = require('mongoose');
import { appConfig } from '../../../helpers/app-config';
import * as fs from 'fs';
import uuidv4 = require('uuid/v4');
import { IModelPackageVersion } from './i-model-package-version';

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
          /^[0-9][-0-9a-z]*([.][0-9]([-]?[0-9a-z])*){2,}$/,
          'Version name only supports lowercase letters and numbers with optional dashes or period in-between characters.' +
          ' Must have 2 periods.' +
          ' Must start with a number and have a number immediately after each decimal point.' +
          ' Example "0.0.0" or "1.0.2-a.1"',
        ],
      },
      archive: {
        type: String,
        trim: true,
        required: [
          true,
          'Version archive is required',
        ],
        // Hijack the base64 encrypted string and turn it into a file
        set: this.stringToFile,
        validate: {
          validator: this.validateFileSize,
          message: `Files limited to ${appConfig.MAX_FILE_SIZE_MB}mb`,
        },
      },
      description: {
        type: String,
        trim: true,
      },
    };
  }

  constructor () {
    super();

    this.schema.pre('remove', function (this: IModelPackageVersion, next) {
      if (fs.existsSync(this.archive)) {
        fs.unlink(this.archive, (err) => {
          if (err) {
            console.error(err);
          }

          next();
        });
      } else {
        next();
      }
    });
  }

  protected transform (doc, ret) {
    // Only hijack local files
    if (!doc.archive.startsWith('http')) {
      ret.archive = `${appConfig.getRootUrl()}/${doc.archive}`
        .replace('public/', '');
    }

    return super.transform(doc, ret);
  }

  private validateFileSize (file: string): boolean {
    const fileDecode = Buffer.from(file, 'base64');
    return fileDecode.byteLength < appConfig.MAX_FILE_SIZE;
  }

  private stringToFile (fileString: string) {
    if (!fileString) {
      return fileString;
    }

    let fileDecode: Buffer;
    try {
      fileDecode = Buffer.from(fileString, 'base64');
    } catch (e) {
      console.error(e);
      return fileString;
    }

    if (fileDecode.byteLength > appConfig.MAX_FILE_SIZE) {
      // File size too large, pass back to validator to detect proper failure message
      return fileString;
    }

    if (!fs.existsSync(appConfig.PUBLIC_FOLDER)) {
      fs.mkdirSync(appConfig.PUBLIC_FOLDER);
    }

    let writePath: string;
    if (appConfig.isEnvTest()) {
      writePath = `${appConfig.PUBLIC_FOLDER}/${appConfig.FILE_FOLDER_TEST}`;
    } else {
      writePath = `${appConfig.PUBLIC_FOLDER}/${appConfig.FILE_FOLDER}`;
    }

    if (!fs.existsSync(writePath)) {
      fs.mkdirSync(writePath);
    }

    const filePath = `${writePath}/${uuidv4()}`;
    fs.writeFileSync(filePath, fileDecode);

    return filePath;
  }
}
