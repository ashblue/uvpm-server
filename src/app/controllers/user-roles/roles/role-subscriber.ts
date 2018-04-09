import { IUserPermissions } from '../i-user-permissions';

export const roleSubscriber: IUserPermissions = {
  createUser: false,
  createOwnPackage: false,
  createOtherPackage: false,
  getPackage: true,
  deleteOwnPackages: false,
  deleteOtherPackages: false,
  searchPackages: true,
};
