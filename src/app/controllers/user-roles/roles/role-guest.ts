import { IUserPermissions } from '../i-user-permissions';

export const roleGuest: IUserPermissions = {
  createUser: false,
  createPackage: false,
  getPackage: false,
  deletePackage: false,
  searchPackages: false,
};
