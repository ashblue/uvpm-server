import { expect } from 'chai';
import { CtrlUserRoles } from './ctrl-user-roles';
import { RoleType } from './roles/e-role-type';
import { PermissionType } from './roles/e-permission-type';

describe('CtrlUserRoles', () => {
  let ctrlUserRoles: CtrlUserRoles;

  beforeEach(() => {
    ctrlUserRoles = new CtrlUserRoles();
  });

  it('should initialize', () => {
    expect(ctrlUserRoles).to.be.ok;
  });

  describe('hasPermission', () => {
    describe('should return true if an Admin role has', () => {
      it('CreateUser permission', () => {
        const result = ctrlUserRoles.hasPermission(RoleType.Admin, PermissionType.CreateUser);
        expect(result).to.be.ok;
      });

      it('CreatePackage permission', () => {
        const result = ctrlUserRoles.hasPermission(RoleType.Admin, PermissionType.CreatePackage);
        expect(result).to.be.ok;
      });

      it('DeletePackage permission', () => {
        const result = ctrlUserRoles.hasPermission(RoleType.Admin, PermissionType.DeletePackage);
        expect(result).to.be.ok;
      });

      it('GetPackage permission', () => {
        const result = ctrlUserRoles.hasPermission(RoleType.Admin, PermissionType.GetPackage);
        expect(result).to.be.ok;
      });

      it('SearchPackages permission', () => {
        const result = ctrlUserRoles.hasPermission(RoleType.Admin, PermissionType.SearchPackages);
        expect(result).to.be.ok;
      });
    });

    describe('should return false if a Guest role has', () => {
      it('CreateUser permission', () => {
        const result = ctrlUserRoles.hasPermission(RoleType.Guest, PermissionType.CreateUser);
        expect(result).to.be.not.ok;
      });

      it('CreatePackage permission', () => {
        const result = ctrlUserRoles.hasPermission(RoleType.Guest, PermissionType.CreatePackage);
        expect(result).to.be.not.ok;
      });

      it('DeletePackage permission', () => {
        const result = ctrlUserRoles.hasPermission(RoleType.Guest, PermissionType.DeletePackage);
        expect(result).to.be.not.ok;
      });

      it('GetPackage permission', () => {
        const result = ctrlUserRoles.hasPermission(RoleType.Guest, PermissionType.GetPackage);
        expect(result).to.be.not.ok;
      });

      it('SearchPackages permission', () => {
        const result = ctrlUserRoles.hasPermission(RoleType.Guest, PermissionType.SearchPackages);
        expect(result).to.be.not.ok;
      });
    });
  });
});
