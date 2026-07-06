import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { ProjectStatus, ProjectDomain } from '../entities/project.entity';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectDomain)
  domain?: ProjectDomain;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  // 🔹 On ajoute l'ID du Project Manager à assigner
  @IsOptional()
  @IsNumber()
  projectManagerId?: number; 
}