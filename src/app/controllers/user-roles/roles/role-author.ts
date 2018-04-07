import { IUserPermissions } from '../i-user-permissions';

export const roleAuthor: IUserPermissions = {
  createUser: false,
  createPackage: true,
  getPackage: true,
  deletePackage: false,
  searchPackages: true,
};
