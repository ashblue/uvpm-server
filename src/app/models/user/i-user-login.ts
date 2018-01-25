import { IModelUser } from './i-model-user';

export interface IUserLogin {
  token: string;
  user: IModelUser;
}
