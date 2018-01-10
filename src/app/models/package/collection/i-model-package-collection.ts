import { IModelBase } from '../../base/i-model-base';
import { IModelUser } from '../../user/i-model-user';
import { IModelPackage } from '../i-model-package';

// @SRC https://gist.github.com/brennanMKE/ee8ea002d305d4539ef6
export interface IModelPackageCollection extends IModelBase {
  name: string;
  owner: IModelUser;
  packages: [IModelPackage];
}
