import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsDate,
} from 'class-validator';
import { CallOutcome, CallStatus } from '../entities/call.entity';

export class UpdateCallDto {
  @IsOptional()
  @IsDate()
  startTime?: Date;

  @IsOptional()
  @IsDate()
  endTime?: Date;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsEnum(CallStatus)
  status?: CallStatus;

  @IsOptional()
  @IsEnum(CallOutcome)
  outcome?: CallOutcome;

  @IsOptional()
  @IsString()
  notes?: string;

  // ⬇️ champs ADMIN / MANAGER seulement
  @IsOptional()
  @IsNumber()
  agentId?: number;

  @IsOptional()
  @IsNumber()
  scriptId?: number;
}

