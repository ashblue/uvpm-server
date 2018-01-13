import { IModelBase } from '../base/i-model-base';

export interface IModelPackage extends IModelBase {
  version: string;
  archive: string;
  description?: string;
}
