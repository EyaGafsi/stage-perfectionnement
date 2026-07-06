import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './../roles/entities/role.entity';
import { PermissionsService } from './permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role])],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
