import { IUserPermissions } from '../i-user-permissions';

export const roleAdmin: IUserPermissions = {
  createUser: true,
  createPackage: true,
  getPackage: true,
  deleteOwnPackages: true,
  deleteOtherPackages: true,
  searchPackages: true,
};
