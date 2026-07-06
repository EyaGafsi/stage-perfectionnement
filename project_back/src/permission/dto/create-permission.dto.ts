export class CreatePermissionDto {
  path: string;
  method: string;
  roleIds?: number[]; // IDs des rôles qui auront cette permission
}
