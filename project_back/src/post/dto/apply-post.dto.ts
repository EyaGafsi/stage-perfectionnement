import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ApplicantLevel {
  JUNIOR = 'Junior',
  INTERMEDIATE = 'Intermédiaire',
  SENIOR = 'Senior/Expert',
}

export enum CvParsingStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export class ApplyPostDto {
  // ── Infos de base ──────────────────────────────
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cvLink?: string;

  // ── Données extraites du CV (envoyées par le front) ──
  @IsOptional()
  @IsString()
  experience_text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  years_experience?: number;

  @IsOptional()
  @IsString()
  education_text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  years_education?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsEnum(ApplicantLevel)
  level?: ApplicantLevel;

  // ── Scores calculés par le front ───────────────
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  experienceScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  educationScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  skillsScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  levelScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number; // Score total pondéré

  // ── Méta ───────────────────────────────────────
  @IsOptional()
  @IsEnum(CvParsingStatus)
  cvParsingStatus?: CvParsingStatus;
}