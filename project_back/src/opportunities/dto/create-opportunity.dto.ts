import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateOpportunityDto {
  @IsNumber()
  @IsNotEmpty()
  leadId: number;

  @IsOptional()
  @IsNumber()
  assignedToId?: number; // COMMERCIAL

  @IsOptional()
  @IsNumber()
  estimatedValue?: number;
}
