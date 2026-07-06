import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { STATUS, InterestLevel } from '../entities/leadqualification.entity';

export class CreateLeadInformationDto {
  @IsString()
  fullname: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  leadOrigin?: string;

  @IsString()
  @IsOptional()
  leadSource?: string;

  @IsBoolean()
  @IsOptional()
  doNotEmail?: boolean;

  @IsBoolean()
  @IsOptional()
  doNotCall?: boolean;

  @IsNumber()
  @IsOptional()
  totalVisits?: number;

  @IsNumber()
  @IsOptional()
  totalTimeOnWebsite?: number;

  @IsNumber()
  @IsOptional()
  pageViewsPerVisit?: number;

  @IsString()
  @IsOptional()
  lastActivity?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsString()
  @IsOptional()
  currentOccupation?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;
}

export class CreateLeadQualificationDto {
  @IsEnum(STATUS)
  @IsOptional()
  STATUS?: STATUS;

  @IsEnum(InterestLevel)
  @IsOptional()
  interestLevel?: InterestLevel;

  @IsString()
  @IsOptional()
  budget?: string;

  @IsString()
  @IsOptional()
  need?: string;

  @IsBoolean()
  @IsOptional()
  decisionMaker?: boolean;

  @IsBoolean()
  @IsOptional()
  converted?: boolean;
}

export class CreateLeadDto {
  leadInfo: CreateLeadInformationDto;
  leadQualification?: CreateLeadQualificationDto;
}
