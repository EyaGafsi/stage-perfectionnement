export class CreateRoleDto {
  name: string;
  permissionIds?: number[]; // IDs des permissions associées
}
