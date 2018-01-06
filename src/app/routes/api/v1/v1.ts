import {RouteUsers} from './users/route-users';
import {App} from '../../../app';
import {CtrlUser} from '../../../controllers/users/ctrl-user';

const routeName = 'v1';

export class RouteV1 {
  public readonly users: RouteUsers;

  constructor (prefix: string, app: App) {
    const ctrlUsers = new CtrlUser(app.db);
    this.users = new RouteUsers(ctrlUsers);
    app.express.use(`${prefix}/${routeName}/users`, this.users.router);
  }
}
