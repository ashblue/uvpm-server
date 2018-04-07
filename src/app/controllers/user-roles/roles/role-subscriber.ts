import { IUserPermissions } from '../i-user-permissions';

export const roleSubscriber: IUserPermissions = {
  createUser: false,
  createPackage: false,
  getPackage: true,
  deletePackage: false,
  searchPackages: true,
};
