
import { IsOptional, IsString, IsNumber, IsInt } from 'class-validator';

export class ProjectITDto {
  @IsOptional() @IsString() programmingLanguages?: string;
  @IsOptional() @IsString() framework?: string;
  @IsOptional() @IsString() database?: string;
  @IsOptional() @IsString() serverDetails?: string;
  @IsOptional() @IsString() architecture?: string;
  @IsOptional() @IsString() apiIntegration?: string;
  @IsOptional() @IsString() securityRequirements?: string;
  @IsOptional() @IsString() devOpsRequirements?: string;

  // Written automatically by persistProjectMetrics() after every sprint save
  @IsOptional() @IsInt()    estimatedDurationDays?: number;
  @IsOptional() @IsNumber() estimatedCost?: number;   // ← was @IsDecimal() — FIXED
  @IsOptional() @IsInt()    teamSize?: number;

  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() businessImpact?: string;
  @IsOptional() @IsString() complexity?: string;
  @IsOptional() @IsString() mainModules?: string;
  @IsOptional() @IsString() keyDeliverables?: string;
  @IsOptional() @IsString() dependencies?: string;
  @IsOptional() @IsString() risks?: string;
  @IsOptional() @IsString() additionalNotes?: string;
}