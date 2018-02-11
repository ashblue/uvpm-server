import * as fs from 'fs';
import * as sinon from 'sinon';
import { fileHelper } from './file-helper';
import * as chai from 'chai';

const expect = chai.expect;

describe('fileHelper', () => {
  describe('createBase64File', () => {
    it('should gracefully fail if a write error is fired', () => {
      const stub = sinon.stub(fs, 'writeFile');
      stub.callsFake((path, bufferSize, options, callback) => {
        callback('err');
      });

      fileHelper.createBase64File(2, (result) => {
        expect(result).to.eq('');
        stub.restore();
      });
    });
  });

  describe('clearFileTestFolder', () => {
    it('should fail gracefully if there is no folder to clear', () => {
      const stub = sinon.stub(fs, 'existsSync');
      stub.callsFake(() => {
        return false;
      });

      fileHelper.clearFileTestFolder((res) => {
        expect(res).to.not.be.ok;
        stub.restore();
      });
    });
  });
});
