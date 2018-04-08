import { App } from '../app';
import { IUserLogin } from '../models/user/i-user-login';
import request = require('supertest');
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
      email: `${uuidv4()}@asd343f.com`,
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
  public static async createUserDetails (app: App, name: string, email: string, password: string): Promise<IUserLogin> {
    const user = { name, email, password };
    const adminToken = await UserHelpers.getToken(app.routes.v1.users.ctrlUser, app.db.models.User, 'admin');

    await request(app.express)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(user)
      .expect(200)
      .expect('Content-Type', /json/);

    return await request(app.express)
      .post('/api/v1/users/login')
      .send(user)
      .expect(200)
      .expect('Content-Type', /json/)
      .then((result) => {
        const userResult: IUserLogin = result.body;
        userResult.authToken = `Bearer ${userResult.token}`;
        return userResult;
      });
  }

  /**
   * @deprecated Use UserHelpers.createUserDetails instead
   * @param {App} app
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<IUserLogin>}
   */
  public async createUser (app: App, name: string, email: string, password: string): Promise<IUserLogin> {
    const user = { name, email, password };
    const adminToken = await UserHelpers.getToken(app.routes.v1.users.ctrlUser, app.db.models.User, 'admin');

    await request(app.express)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(user)
      .expect(200)
      .expect('Content-Type', /json/);

    return await request(app.express)
      .post('/api/v1/users/login')
      .send(user)
      .expect(200)
      .expect('Content-Type', /json/)
      .then((result) => {
        const userResult: IUserLogin = result.body;
        userResult.authToken = `Bearer ${userResult.token}`;
        return userResult;
      });
  }
}

/**
 * @deprecated User static equivalents instead
 * @type {UserHelpers}
 */
export const userHelpers = new UserHelpers();
