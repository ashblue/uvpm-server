import { IModelUser } from './i-model-user';

export interface IUserLogin {
  /**
   * The token ready to be paired with an Authorization header field
   */
  authToken?: string;
  token: string;
  user: IModelUser;
}
