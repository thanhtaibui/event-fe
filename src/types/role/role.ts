export interface Role {
  id: string;

  role_name: string;

  role_code: string;

  orgName: string;

  permissions: Permission[];

  colorKey: string;
}
export interface Permission {

  permission_name: string;

  permission_code: string;

  children?: Permission[];

  isAll?: boolean;
}