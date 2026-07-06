import { IsString, IsDate, IsOptional, IsNumber, IsArray, IsDateString, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class AssignedToIdDto {
  @IsInt()
  id: number;
}

export class CreateSprintCallCenterDto {
  @IsString()
  name: string;

  @IsDateString() startDate: string; 
  @IsDateString() endDate: string;    

  @IsOptional()
  @IsNumber()
  targetAgents: number;

  @IsOptional()
  @IsNumber()
  expectedCallVolume: number;

  @IsOptional()
  @IsNumber()
  targetConversionRate: number;

  @IsOptional()
  @IsNumber()
  budgetAllocated: number;

  @IsOptional()
  @IsNumber()
  qualityScoreTarget: number;

  @IsOptional()
  @IsString()
  trainingContent: string;

  @IsOptional()
  @IsString()
  scriptTemplates: string;

  @IsOptional()
  @IsString()
  goals: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskCallCenterDto)
  tasks?: CreateTaskCallCenterDto[];
}

export class CreateTaskCallCenterDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  priority: string;

  @IsOptional()
  @IsNumber()
  estimatedHours: number;

  @IsOptional()
  @IsNumber()
  aiEstimatedHours?: number;

  @IsOptional()
  @IsNumber()
  targetAgentCount: number;

  @IsOptional()
  @IsNumber()
  expectedCallsPerAgent: number;

  @IsOptional()
  @IsNumber()
  targetConversionRate: number;

  @IsOptional()
  @IsNumber()
  qualityScoreTarget: number;

  @IsOptional()
  @IsString()
  scriptContent: string;

  @IsOptional()
  @IsNumber()
  assignedToId: number;

  @IsOptional() @IsString() scheduledStartDate?: string | null;
  @IsOptional() @IsString() scheduledEndDate?: string | null;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  complexityScore?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  riskLevel?: number;

  @IsOptional() @IsString()
  dependencies?: string;

  @IsOptional() @IsString()
  risks?: string;

  @IsOptional() @IsString()
  additionalNotes?: string;

  @IsOptional() @IsString()
  delayReason?: string;

  @IsOptional() @IsNumber()
  delayHours?: number;

  // assignedTo: { id } — sent by the frontend serializer as alternative to assignedToId
  @IsOptional()
  @ValidateNested()
  @Type(() => AssignedToIdDto)
  assignedTo?: AssignedToIdDto | null;
}