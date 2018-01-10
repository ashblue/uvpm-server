import { IModelBase } from '../base/i-model-base';

// @SRC https://gist.github.com/brennanMKE/ee8ea002d305d4539ef6
export interface IModelUser extends IModelBase {
  name: string;
  email: string;
  password; string;
}
