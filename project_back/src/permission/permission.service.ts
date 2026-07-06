import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Role } from './../roles/entities/role.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>
  ) {}

  async create(dto: CreatePermissionDto) {
    const permission = this.permissionRepo.create({
      path: dto.path,
      method: dto.method,
    });

    if (dto.roleIds) {
      permission.roles = await this.roleRepo.findByIds(dto.roleIds);
    }

    return this.permissionRepo.save(permission);
  }

  findAll() {
    return this.permissionRepo.find({ relations: ['roles'] });
  }
}
