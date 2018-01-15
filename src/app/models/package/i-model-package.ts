import { IModelBase } from '../base/i-model-base';
import { IPackageData } from './i-package-data';
import { IModelUser } from '../user/i-model-user';
import { IModelPackageVersion } from './version/i-model-package-version';

// @SRC https://gist.github.com/brennanMKE/ee8ea002d305d4539ef6
export interface IModelPackage extends IModelBase, IPackageData {
  author: IModelUser;
  versions: [IModelPackageVersion];
}
