import { IModelBase } from '../base/i-model-base';
import { IModelUser } from '../user/i-model-user';
import { IModelPackageVersion } from './version/i-model-package-version';

// @SRC https://gist.github.com/brennanMKE/ee8ea002d305d4539ef6
export interface IModelPackage extends IModelBase {
  name: string;
  author: IModelUser;
  versions: [IModelPackageVersion];
}
