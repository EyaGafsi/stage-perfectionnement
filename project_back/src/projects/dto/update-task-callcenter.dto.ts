import { IsString, IsOptional, IsNumber, IsDate, IsDateString, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class AssignedToIdDto {
  @IsInt()
  id: number;
}

export class UpdateTaskCallCenterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  targetAgentCount?: number;

  @IsOptional()
  @IsNumber()
  targetConversionRate?: number;

  @IsOptional()
  @IsNumber()
  qualityScoreTarget?: number;

  @IsOptional()
  @IsString()
  scriptContent?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AssignedToIdDto)
  assignedTo?: AssignedToIdDto;

  @IsOptional()
  @IsString()
  type?: string;              // ← was missing entirely
  @IsOptional() @IsString() scheduledStartDate?: string | null;
  @IsOptional() @IsString() scheduledEndDate?: string | null;
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  delayReason?: string;

  @IsOptional()
  @IsNumber()
  complexityScore?: number;

  @IsOptional()
  @IsNumber()
  riskLevel?: number;

  @IsOptional()
  @IsNumber()
  expectedCallsPerAgent?: number;

  @IsOptional()
  @IsNumber()
  assignedToId?: number;

  @IsOptional()
  @IsNumber()
  delayHours?: number;
}