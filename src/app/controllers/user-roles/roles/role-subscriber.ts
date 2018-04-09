import { IUserPermissions } from '../i-user-permissions';

export const roleSubscriber: IUserPermissions = {
  createUser: false,
  createPackage: false,
  getPackage: true,
  deleteOwnPackages: false,
  deleteOtherPackages: false,
  searchPackages: true,
};
