import * as process from 'process';

/**
 * @TODO These configs should be overridable with a JSON file placed in the app's root
 */
class AppConfig {
  // Max file size in megabytes
  public MAX_FILE_SIZE_MB = 5;

  public DEFAULT_PORT = 3000;

  public DB_DEFAULT_URL = 'mongodb://localhost/uv-package-manager';
  public DB_TEST_URL = 'mongodb://localhost/uv-package-manager-test';

  public PUBLIC_FOLDER = 'public';
  public FILE_FOLDER = 'files';
  public FILE_FOLDER_TEST = 'tmp-files';

  public ROOT_URL = 'http://uvpm.com';
  public ROOT_URL_TEST = 'http://localhost:3000';

  /**
   * Check if this is the testing environment
   */
  public isEnvTest () {
    return process.env.TEST === 'true';
  }

  /**
   * Check if this is the production environment
   */
  public isEnvProcution () {
    return process.env.NODE_ENV === 'production';
  }

  public getFileFolder () {
    if (this.isEnvTest()) {
      return this.FILE_FOLDER_TEST;
    }

    return this.FILE_FOLDER;
  }

  public getRootUrl () {
    if (this.isEnvProcution()) {
      return this.ROOT_URL;
    }

    return this.ROOT_URL_TEST;
  }
}

export const appConfig = new AppConfig();
