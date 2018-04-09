import { IUserPermissions } from './i-user-permissions';
import { roleAdmin } from './roles/role-admin';
import { roleAuthor } from './roles/role-author';
import { roleSubscriber } from './roles/role-subscriber';
import { roleGuest } from './roles/role-guest';
import { RoleType } from './roles/e-role-type';
import { PermissionType } from './roles/e-permission-type';

export class CtrlUserRoles {
  public static roles = {
    admin: roleAdmin,
    author: roleAuthor,
    subscriber: roleSubscriber,
    guest: roleGuest,
  };

  public hasPermission (role: RoleType, permission: PermissionType): boolean {
    const rolePermissions = this.getRolePermissions(role);

    if (permission === PermissionType.CreateUser) {
      return rolePermissions.createUser;
    } else if (permission === PermissionType.CreateOwnPackage) {
      return rolePermissions.createOwnPackage;
    } else if (permission === PermissionType.CreateOtherPackage) {
      return rolePermissions.createOtherPackage;
    } else if (permission === PermissionType.DeleteOwnPackages) {
      return rolePermissions.deleteOwnPackages;
    } else if (permission === PermissionType.DeleteOtherPackages) {
      return rolePermissions.deleteOtherPackages;
    } else if (permission === PermissionType.GetPackage) {
      return rolePermissions.getPackage;
    } else if (permission === PermissionType.SearchPackages) {
      return rolePermissions.searchPackages;
    }

    throw new Error(`Permission does not exist ${permission} for role ${role}`);
  }

  private getRolePermissions (role: RoleType): IUserPermissions {
    switch (role) {
      case RoleType.Admin:
        return CtrlUserRoles.roles.admin;
      case RoleType.Author:
        return CtrlUserRoles.roles.author;
      case RoleType.Subscriber:
        return CtrlUserRoles.roles.subscriber;
      case RoleType.Guest:
        return CtrlUserRoles.roles.guest;
      default:
        throw new Error(`Requested role type does not exist ${role}`);
    }
  }
}
