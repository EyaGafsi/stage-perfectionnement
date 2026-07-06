import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateProjectMarketingDto {
  @IsOptional() @IsString()
  campaignType?: string;

  @IsOptional() @IsString()
  targetAudience?: string;

  @IsOptional() @IsString()
  channels?: string;

  @IsOptional() @IsString()
  priority?: string;

  @IsOptional() @IsString()
  businessImpact?: string;

  @IsOptional() @IsString()
  mainGoals?: string;

  @IsOptional() @IsString()
  keyDeliverables?: string;

  @IsOptional() @IsString()
  metrics?: string;

  @IsOptional() @IsString()
  dependencies?: string;

  @IsOptional() @IsString()
  risks?: string;

  @IsOptional() @IsString()
  additionalNotes?: string;

  // ── Computed by AI pipeline — written back via PATCH /marketing-details ──

  /** Number of working days estimated (totalHours / 8 / teamSize) */
  @IsOptional() @IsNumber()
  estimatedDurationDays?: number;

  /** AI-predicted project cost in EUR */
  @IsOptional() @IsNumber()
  estimatedCost?: number;

  /** Sum of sprint budgets fallback */
  @IsOptional() @IsNumber()
  estimatedBudget?: number;

  /** Number of project members at time of estimation */
  @IsOptional() @IsNumber()
  teamSize?: number;
}