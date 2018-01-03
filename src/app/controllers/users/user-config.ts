import * as process from 'process';

export const userConfig = {
  jwtSecret: process.env.JWT_SECRET || '%>}63<4y@^%%4KMw',
  jwtSession: {
    session: false,
  },
};
