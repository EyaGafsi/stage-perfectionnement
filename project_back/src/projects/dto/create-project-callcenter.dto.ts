import { IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateProjectCallCenterDto {
  @IsOptional() @IsNumber() numberOfAgents?: number;
  @IsOptional() @IsNumber() numberOfCallsPerDay?: number;
  @IsOptional() @IsString() callTypes?: string;
  @IsOptional() @IsNumber() slaTargetSeconds?: number;
  @IsOptional() @IsNumber() averageHandleTimeSec?: number;
  @IsOptional() @IsNumber() estimatedDurationDays?: number;
  @IsOptional() @IsNumber() teamSize?: number;

  // ← Ces champs manquent probablement
  @IsOptional() @IsNumber() estimatedBudget?: number;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsNumber() CSAT?: number;
  @IsOptional() @IsNumber() FCR?: number;
  @IsOptional() @IsNumber() risksScore?: number;
  @IsOptional() @IsString() dependencies?: string;
  @IsOptional() @IsString() mainGoals?: string;
  @IsOptional() @IsString() additionalNotes?: string;
}