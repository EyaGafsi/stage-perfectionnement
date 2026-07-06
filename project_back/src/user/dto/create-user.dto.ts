import { IsEmail, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole, MemberLevel } from '../entities/user.entity';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  fullname: string;

  @IsNotEmpty()
  numtel: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(MemberLevel)
  memberlevel?: MemberLevel;
  @IsOptional()
  cvlink:string;

  @IsOptional()
  @Type(() => Number)
  companyId?: number; // Id de la société si applicable
}