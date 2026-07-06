import { IsOptional, IsEnum, IsNumber, IsString, IsDate } from 'class-validator';
import { CallOutcome } from '../entities/call.entity';

export class CreateCallDto {
  @IsNumber()
  leadId: number;

  @IsNumber()
  agentId: number;

  @IsOptional()
  @IsNumber()
  scriptId?: number;

  @IsDate()
  startTime: Date;

  @IsOptional()
  @IsDate()
  endTime?: Date;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsEnum(CallOutcome)
  outcome?: CallOutcome;

  @IsOptional()
  @IsString()
  notes?: string;
}
