import {
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import {
  ContractType,
  EmploymentStatus,
  DepartureReason,
} from '../entities/member-profile.entity';

export class CreateMemberProfileDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsDateString()
  hireDate: string;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonuses?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCompensation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  performanceRating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  projectsCompleted?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  attendanceRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  absenceCount?: number;

  @IsOptional()
  @IsDateString()
  deactivationDate?: string | null;

  @IsOptional()
  @IsEnum(DepartureReason)
  departureReason?: DepartureReason | null;
}

export class UpdateMemberProfileDto {
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonuses?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCompensation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  performanceRating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  projectsCompleted?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  attendanceRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  absenceCount?: number;

  @IsOptional()
  @IsDateString()
  deactivationDate?: string | null;

  @IsOptional()
  @IsEnum(DepartureReason)
  departureReason?: DepartureReason | null;
}