import { ModelBase } from '../../base/model-base';
import mongoose = require('mongoose');
import { appConfig } from '../../../helpers/app-config';
import * as fs from 'fs';
import uuidv4 = require('uuid/v4');

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
        // Hijack the base64 encrypted string and turn it into a file
        set: this.stringToFile,
      },
      description: {
        type: String,
        trim: true,
      },
    };
  }

  protected transform (doc, ret) {
    // Only hijack local files
    if (!doc.archive.startsWith('http')) {
      ret.archive = `${appConfig.getRootUrl()}/${doc.archive}`
        .replace('public/', '');
    }

    return super.transform(doc, ret);
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
