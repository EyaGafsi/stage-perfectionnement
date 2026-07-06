import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { Permission } from './../permission/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>
  ) {}

  async create(dto: CreateRoleDto) {
    const role = this.roleRepo.create({ name: dto.name });
    if (dto.permissionIds) {
      role.permissions = await this.permissionRepo.findByIds(dto.permissionIds);
    }
    return this.roleRepo.save(role);
  }

  findAll() {
    return this.roleRepo.find({ relations: ['permissions'] });
  }
}
