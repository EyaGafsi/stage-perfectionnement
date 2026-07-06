import { IsString, IsDate, IsOptional, IsNumber,IsDateString } from 'class-validator';

export class UpdateSprintCallCenterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional() @IsDateString() startDate?: string;  // ← était @IsDate()
  @IsOptional() @IsDateString() endDate?: string;    // ← était @IsDate()

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  targetAgents?: number;

  @IsOptional()
  @IsNumber()
  expectedCallVolume?: number;

  @IsOptional()
  @IsNumber()
  budgetAllocated?: number;

  @IsOptional()
  @IsString()
  goals?: string;

  @IsOptional()
  @IsString()
  trainingContent?: string;
}