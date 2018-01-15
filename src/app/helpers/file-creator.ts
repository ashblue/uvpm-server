import * as fs from 'fs';
import tmp = require('tmp');
import { appConfig } from './app-config';
import rimraf = require('rimraf');

export const fileHelper = {
  clearFileTestFolder: (done: (err?: Error) => void) => {
    if (fs.existsSync(appConfig.FILE_FOLDER_TEST)) {
      rimraf(appConfig.FILE_FOLDER_TEST, done);
    } else {
      done();
    }
  },

  createBase64File: (sizeMb: number, done: (base64: string) => void) => {
    const bufferSize = new Buffer(1024 * 1024 * sizeMb);

    tmp.file((err, path, fd, cleanupCallback) => {
      fs.writeFile(path, bufferSize, 'utf8', (errWrite) => {
        if (errWrite) {
          console.error(errWrite);
          cleanupCallback();
          done('');
          return;
        }

        const bitmap = fs.readFileSync(path);
        const base64 = new Buffer(bitmap).toString('base64');
        cleanupCallback();
        done(base64);
      });
    });
  },

  createBase64FileText: (text: string, done: (base64: string) => void) => {
    tmp.file((err, path, fd, cleanupCallback) => {
      fs.writeFile(path, text, 'utf8', (errWrite) => {
        if (errWrite) {
          console.error(errWrite);
          cleanupCallback();
          done('');
          return;
        }

        const bitmap = fs.readFileSync(path);
        const base64 = new Buffer(bitmap).toString('base64');
        cleanupCallback();
        done(base64);
      });
    });
  },
};
