export interface Role {
  id: string;

  role_name: string;

  role_code: string;

  org: Org;

  permissions: Permission[];

  colorKey: string;
}
export interface Permission {

  permission_name: string;

  permission_code: string;

  children?: Permission[];

  isAll?: boolean;
}
export interface Org {
  id: string;

  name: string;
}