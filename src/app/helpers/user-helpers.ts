import { App } from '../app';
import { IUserLogin } from '../models/user/i-user-login';
import request = require('supertest');

export class UserHelpers {
  /**
   * @param {App} app
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {IUserLogin}
   */
  public async createUser (app: App, name: string, email: string, password: string): Promise<IUserLogin> {
    const user = { name, email, password };

    await request(app.express)
      .post('/api/v1/users')
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

export const userHelpers = new UserHelpers();
