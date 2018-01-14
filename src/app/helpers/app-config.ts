import * as process from 'process';

const PUBLIC_FOLDER = 'public';

export const appConfig = {
  DB_DEFAULT_URL: 'mongodb://localhost/uv-package-manager',
  DB_TEST_URL: 'mongodb://localhost/uv-package-manager-test',

  PUBLIC_FOLDER,
  FILE_FOLDER: `${PUBLIC_FOLDER}/files`,
  FILE_FOLDER_TEST: `${PUBLIC_FOLDER}/tmp-files`,

  /**
   * Check if this is the testing environment
   */
  isEnvTest: () => {
    return process.env.TEST === 'true';
  },
};
