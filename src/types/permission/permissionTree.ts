export interface PermissionTree {
  id: string;

  permission_name: string;

  children?: PermissionTree[];

}