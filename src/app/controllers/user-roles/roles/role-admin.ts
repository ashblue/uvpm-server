import { IUserPermissions } from '../i-user-permissions';

export const roleAdmin: IUserPermissions = {
  createUser: true,
  createOwnPackage: true,
  createOtherPackage: true,
  getPackage: true,
  deleteOwnPackages: true,
  deleteOtherPackages: true,
  searchPackages: true,
};
