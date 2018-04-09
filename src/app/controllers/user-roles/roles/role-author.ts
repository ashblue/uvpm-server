import { IUserPermissions } from '../i-user-permissions';

export const roleAuthor: IUserPermissions = {
  createUser: false,
  createPackage: true,
  getPackage: true,
  deleteOwnPackages: true,
  deleteOtherPackages: false,
  searchPackages: true,
};
