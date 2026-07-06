import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AssignedToDto {
  @IsNumber()
  id: number;
}

export class UpdateTaskMarketingDto {
  // ── Core fields ───────────────────────────────────────────────────────────
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  priority?: string;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsString()
  channel?: string;

  // ── Hours (int column) ────────────────────────────────────────────────────
  @IsOptional() @IsNumber()
  estimatedHours?: number;

  /** AI-predicted hours — stored for history / display */
  @IsOptional() @IsNumber()
  aiEstimatedHours?: number;

  // ── Financial ─────────────────────────────────────────────────────────────
  @IsOptional() @IsNumber()
  budget?: number;

  /** Alias for budget — sent by ML form as 'cost' */
  @IsOptional() @IsNumber()
  cost?: number;

  // ── Performance targets ───────────────────────────────────────────────────
  @IsOptional() @IsNumber()
  expectedViews?: number;

  /** Alias used in ML payload */
  @IsOptional() @IsNumber()
  impressions?: number;

  @IsOptional() @IsNumber()
  expectedClicks?: number;

  @IsOptional() @IsNumber()
  expectedLeads?: number;

  @IsOptional() @IsNumber()
  expectedConversions?: number;

  @IsOptional() @IsNumber()
  expectedCTR?: number;

  @IsOptional() @IsNumber()
  expectedConversionRate?: number;

  // ── ML model inputs (stored so re-estimation can replay exact inputs) ─────
  @IsOptional() @IsNumber()
  complexityScore?: number;   // maps to 'complexity' in ML payload (int 1–5)

  @IsOptional() @IsNumber()
  riskLevel?: number;         // maps to 'effort' in ML payload (int 1–5)

  /** Quality score 1–5, sent to ML as 'score' */
  @IsOptional() @IsNumber()
  score?: number;

  // ── Platforms / additional text ───────────────────────────────────────────
  @IsOptional() @IsString()
  platforms?: string;

  @IsOptional() @IsString()
  dependencies?: string;

  @IsOptional() @IsString()
  risks?: string;

  @IsOptional() @IsString()
  additionalNotes?: string;

  // ── Dates ─────────────────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  scheduledStartDate?: string | null;

  @IsOptional()
  @IsString()
  scheduledEndDate?: string | null;

  // ── Assignee — two accepted formats ──────────────────────────────────────
  /** Object format: { id: number } */
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AssignedToDto)
  assignedTo?: AssignedToDto;

  /** Flat format for backward compat */
  @IsOptional() @IsNumber()
  assignedToId?: number;

  @IsOptional() @IsString()
  delayReason?: string;

  @IsOptional() @IsNumber()
  delayHours?: number;
}