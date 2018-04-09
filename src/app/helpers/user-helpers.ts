import { App } from '../app';
import { IUserLogin } from '../models/user/i-user-login';
import { IModelUser } from '../models/user/i-model-user';
import * as mongoose from 'mongoose';
import { CtrlUser } from '../controllers/users/ctrl-user';
import uuidv4 = require('uuid/v4');

export class UserHelpers {
  public static async getTokenFromApp (app: App, role: string) {
    return await UserHelpers.getToken(app.routes.v1.users.ctrlUser, app.db.models.User, role);
  }

  public static async getToken (ctrlUser: CtrlUser, UserModel: mongoose.Model<IModelUser>, role: string) {
    const modelUser = new UserModel({
      name: 'Lorem Ipsum',
      email: `${uuidv4()}@${uuidv4()}.com`,
      password: 'asdfasdf1',
      role,
    });

    const user = await modelUser.save();

    return ctrlUser.getUserToken(user.id);
  }

  /**
   * @param {App} app
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {IUserLogin}
   */
  public static async createUserDetails (app: App, name: string, email: string, password: string, role = 'admin'): Promise<IUserLogin> {
    const modelUser = new app.db.models.User({
      name: 'Lorem Ipsum',
      email: `${uuidv4()}@asd343f.com`,
      password: 'asdfasdf1',
      role,
    });

    const user = await modelUser.save();
    const token = app.routes.v1.users.ctrlUser.getUserToken(user.id);

    return {
      authToken: `Bearer ${token}`,
      user,
      token,
    };
  }
}
