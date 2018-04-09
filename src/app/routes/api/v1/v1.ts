import { RouteUsers } from './users/route-users';
import { App } from '../../../app';
import { CtrlUser } from '../../../controllers/users/ctrl-user';
import { RoutePackages } from './packages/route-packages';
import { CtrlPackage } from '../../../controllers/packages/ctrl-package';
import { CtrlPackageVersion } from '../../../controllers/packages/versions/ctrl-package-version';
import { RoutePackageVersions } from './packages/versions/route-package-versions';

const routeName = 'v1';

export class RouteV1 {
  public readonly users: RouteUsers;
  public readonly packages: RoutePackages;
  public readonly packageVersions: RoutePackageVersions;

  constructor (private prefix: string, app: App) {
    this.users = this.setupRouterUsers(app);
    this.packages = this.setupRoutePackages(app);
    this.packageVersions = this.setupRouterPackageVersions(app);
  }

  private setupRouterPackageVersions (app: App) {
    const ctrlPackageVersion = new CtrlPackageVersion(app.db, app.userRoles);
    const packages = new RoutePackageVersions(ctrlPackageVersion, this.users.ctrlUser);
    app.express.use(`${this.prefix}/${routeName}/packages`, packages.router);

    return packages;
  }

  private setupRouterUsers (app: App) {
    const ctrlUsers = new CtrlUser(app.db, app.userRoles);
    const users = new RouteUsers(ctrlUsers);
    app.express.use(`${this.prefix}/${routeName}/users`, users.router);

    return users;
  }

  private setupRoutePackages (app: App) {
    const ctrlPackages = new CtrlPackage(app.db, app.userRoles);
    const packages = new RoutePackages(ctrlPackages, this.users.ctrlUser);
    app.express.use(`${this.prefix}/${routeName}/packages`, packages.router);

    return packages;
  }
}
