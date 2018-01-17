import { IPackageVersionData } from './version/i-package-version-data';
import { IUserData } from '../user/i-user-data';

export interface IPackageData {
  name: string;
  author: IUserData | string;
  versions: [IPackageVersionData];
}
