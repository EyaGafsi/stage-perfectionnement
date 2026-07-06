// src/post/dto/create-post.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RequiredLevel {
  JUNIOR = 'Junior',
  INTERMEDIATE = 'Intermédiaire',
  SENIOR = 'Senior/Expert',
}

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  // Expérience
  @IsOptional()
  @IsString()
  experienceDescription?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minYearsExperience?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxYearsExperience?: number;

  // Formation
  @IsOptional()
  @IsString()
  educationDescription?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minYearsEducation?: number;

  // Compétences
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSkills?: string[];

  @IsOptional()
  @IsString()
  skillsDescription?: string;

  // Niveau
  @IsEnum(RequiredLevel)
  requiredLevel: RequiredLevel;

  @IsOptional()
  @IsString()
  levelDescription?: string;

  // Tags & Keywords
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}