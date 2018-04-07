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
    it('should throw an error if the role has no match', () => {
      expect(() => ctrlUserRoles.hasPermission(false as any, PermissionType.CreateUser))
        .to.throw('Requested role type does not exist false');
    });

    it('should throw an error if the permission has no match', () => {
      expect(() => ctrlUserRoles.hasPermission(RoleType.Admin, false as any))
        .to.throw('Permission does not exist false for role 0');
    });

    it('should return true for author to create packages', () => {
      const result = ctrlUserRoles.hasPermission(RoleType.Author, PermissionType.CreatePackage);
      expect(result).to.be.ok;
    });

    it('should return true for a subscriber to read packages', () => {
      const result = ctrlUserRoles.hasPermission(RoleType.Subscriber, PermissionType.GetPackage);
      expect(result).to.be.ok;
    });

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
