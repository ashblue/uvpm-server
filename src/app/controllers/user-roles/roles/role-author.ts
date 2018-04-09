import { IUserPermissions } from '../i-user-permissions';

export const roleAuthor: IUserPermissions = {
  createUser: false,
  createOwnPackage: true,
  createOtherPackage: false,
  getPackage: true,
  deleteOwnPackages: true,
  deleteOtherPackages: false,
  searchPackages: true,
};
