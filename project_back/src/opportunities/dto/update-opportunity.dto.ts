import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class UpdateOpportunityDto {
  @IsOptional()
  @IsEnum(['open', 'won', 'lost'])
  status?: string;

  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @IsOptional()
  @IsNumber()
  assignedToId?: number;
}
