import { RoleType } from '../../controllers/user-roles/roles/e-role-type';

export interface IUserData {
  name: string;
  email: string;
  password: string;
  role?: RoleType;
  id?: string;
}
