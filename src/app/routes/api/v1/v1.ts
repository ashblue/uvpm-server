import { RouteUsers } from './users/route-users';
import { App } from '../../../app';
import { CtrlUser } from '../../../controllers/users/ctrl-user';
import { RoutePackages } from './packages/route-packages';
import { CtrlPackage } from '../../../controllers/packages/ctrl-package';

const routeName = 'v1';

export class RouteV1 {
  public readonly users: RouteUsers;
  public readonly packages: RoutePackages;

  constructor (private prefix: string, app: App) {
    this.users = this.setupRouterUsers(app);
    this.packages = this.setupRoutePackages(app);
  }

  private setupRouterUsers (app: App) {
    const ctrlUsers = new CtrlUser(app.db);
    const users = new RouteUsers(ctrlUsers);
    app.express.use(`${this.prefix}/${routeName}/users`, users.router);

    return users;
  }

  private setupRoutePackages (app: App) {
    const ctrlPackages = new CtrlPackage(app.db);
    const packages = new RoutePackages(ctrlPackages, this.users.ctrlUser);
    app.express.use(`${this.prefix}/${routeName}/packages`, packages.router);

    return packages;
  }
}
