import { IsString, IsDate, IsOptional, IsNumber, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class AssignedToIdDto {
  @IsInt()
  id: number;
}
export class CreateTaskMarketingDto {
  @IsString()
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  priority?: string;

  @IsOptional() @IsNumber()
  estimatedHours?: number;

  @IsOptional() @IsNumber()
  budget?: number;

  @IsOptional() @IsNumber()
  expectedViews?: number;

  @IsOptional() @IsNumber()
  expectedClicks?: number;

  @IsOptional() @IsNumber()
  expectedLeads?: number;

  @IsOptional() @IsNumber()
  expectedConversions?: number;

  @IsOptional() @IsNumber()
  expectedCTR?: number;

  @IsOptional() @IsString()
  channel?: string;

  @IsOptional() @IsNumber()
  assignedToId?: number;

  @IsOptional()
  @IsString()
  scheduledEndDate?: string | null;

  @IsOptional()
  @IsString()
  scheduledStartDate?: string | null;


  // ✅ Champs AI — whitelist les accepte maintenant
  @IsOptional() @IsNumber()
  aiEstimatedHours?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  complexityScore?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  riskLevel?: number;

  @IsOptional() @IsNumber()
  score?: number;

  @IsOptional() @IsString()
  delayReason?: string;

  @IsOptional() @IsNumber()
  delayHours?: number;

  // assignedTo: { id } — sent by the frontend serializer
  // @ValidateNested() is required so whitelist mode keeps the nested object
  @IsOptional()
  @ValidateNested()
  @Type(() => AssignedToIdDto)
  assignedTo?: AssignedToIdDto | null;
}

export class CreateSprintMarketingDto {
  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional() @IsNumber()
  totalBudget?: number;

  @IsOptional() @IsString()
  campaignType?: string;

  @IsOptional() @IsString()
  targetAudience?: string;

  @IsOptional() @IsNumber()
  expectedReach?: number;

  @IsOptional() @IsNumber()
  expectedLeads?: number;

  @IsOptional() @IsNumber()
  expectedROI?: number;

  @IsOptional() @IsString()
  channels?: string;

  @IsOptional() @IsString()
  goals?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  priority?: string;

  @IsOptional() @IsString()
  complexity?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })  // ← CLEF : valide chaque tâche
  @Type(() => CreateTaskMarketingDto)
  tasks?: CreateTaskMarketingDto[];

}