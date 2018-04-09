import { IUserPermissions } from '../i-user-permissions';

export const roleGuest: IUserPermissions = {
  createUser: false,
  createOwnPackage: false,
  createOtherPackage: false,
  getPackage: false,
  deleteOwnPackages: false,
  deleteOtherPackages: false,
  searchPackages: false,
};
