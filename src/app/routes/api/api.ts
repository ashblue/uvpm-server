import { RouteV1 } from './v1/v1';
import { App } from '../../app';

const routeName = 'api';

export class RouteApi {
  public readonly v1: RouteV1;

  constructor (app: App) {
    this.v1 = new RouteV1(`/${routeName}`, app);
  }
}
