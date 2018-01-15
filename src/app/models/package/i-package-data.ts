import { IModelUser } from '../user/i-model-user';
import { IModelPackageVersion } from './version/i-model-package-version';

export interface IPackageData {
  name: string;
  author: IModelUser;
  versions: [IModelPackageVersion];
}
