import { IModelPackage } from '../../../models/package/i-model-package';
import { Database } from '../../databases/database';
import { IPackageData } from '../../../models/package/i-package-data';
import * as fs from 'fs';
import { appConfig } from '../../../helpers/app-config';
import uuidv4 = require('uuid/v4');

/**
 * @TODO File creation and deletion should be offloaded to an inejctable base class
 *       Allows for Google Cloud or local file handling
 */
export class CtrlPackageVersion {
  constructor (private db: Database) {
  }

  public create (data: IPackageData, done: (err?: Error, result?: IModelPackage) => void) {
    const version = new this.db.models.Package(data);
    const err = version.validateSync();

    if (err) {
      done(err);
      return;
    }

    let fileDecode: Buffer;
    try {
      fileDecode = Buffer.from(version.archive, 'base64');
    } catch (e) {
      console.error(e);
      done(new Error('Could not decode the archive. Must be base64 encoded'));
      return;
    }

    // @TODO Move all file creation to the model itself (auto-generates this)
    if (!fs.existsSync(appConfig.PUBLIC_FOLDER)) {
      fs.mkdirSync(appConfig.PUBLIC_FOLDER);
    }

    let path: string;
    if (appConfig.isEnvTest()) {
      path = appConfig.FILE_FOLDER_TEST;
    } else {
      path = appConfig.FILE_FOLDER;
    }

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }

    const filePath = `${path}/${uuidv4()}`;

    fs.writeFile(filePath, fileDecode, (err) => {
      if (err) {
        console.error(err);
        done(err);
        return;
      }

      version.archive = filePath;
      version.save((err, result) => {
        done(err, result);
      });
    });
  }
}
