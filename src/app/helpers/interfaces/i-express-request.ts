import * as express from 'express';
import {IModelUser} from '../../models/user/i-model-user';

export interface IExpressRequest extends express.Request {
  user?: IModelUser;
}
