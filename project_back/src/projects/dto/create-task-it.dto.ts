// ─── create-task-it.dto.ts ───────────────────────────────────────────────────
import { IsString, IsOptional, IsEnum, IsInt, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskType, TaskStatus, TaskPriority } from '../entities/TaskITEntity.entity';

export class AssignedToIdDto {
  @IsInt()
  id: number;
}

export class CreateTaskITDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;


  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  storyPoints?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  estimatedHours?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  aiEstimatedHours?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  aiDelayRiskProbability?: number;

  @IsString()
  @IsOptional()
  aiPredictedDelayReason?: string;

  // ── Scores (int 1-5) ───────────────────────────────────────────────────────
  // These were missing — NestJS whitelist stripped them silently.
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  complexityScore?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  riskLevel?: number;

  // ── Text fields ────────────────────────────────────────────────────────────
  @IsString()
  @IsOptional()
  complexity?: string; // 'Low' | 'Medium' | 'High' — text label, separate from complexityScore

  @IsString()
  @IsOptional()
  dependencies?: string;

  @IsString()
  @IsOptional()
  risks?: string;

  @IsString()
  @IsOptional()
  additionalNotes?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  delayHours?: number;
  
  @IsOptional()
  @IsString() // Add IsString since dates are sent as ISO strings
  scheduledStartDate?: string | null;

  @IsOptional()
  @IsString()
  scheduledEndDate?: string | null;

  // ── Assignee ───────────────────────────────────────────────────────────────
  // assignedToId: kept for backward compat (createSprintsWithTasks uses it)
  @IsInt()
  @IsOptional()
  assignedToId?: number;

  @IsInt()
  @IsOptional()
  sprintId?: number;

  // assignedTo: { id } — sent by serializeTask() on PATCH
  // Validated as a nested object so whitelist doesn't strip it.
  @IsOptional()
  @ValidateNested()
  @Type(() => AssignedToIdDto)
  assignedTo?: AssignedToIdDto | null;

  @IsOptional()
  @IsString()
  delayReason?: string;
}