import { IUserPermissions } from '../i-user-permissions';

export const roleAdmin: IUserPermissions = {
  createUser: true,
  createPackage: true,
  getPackage: true,
  deletePackage: true,
  searchPackages: true,
};
