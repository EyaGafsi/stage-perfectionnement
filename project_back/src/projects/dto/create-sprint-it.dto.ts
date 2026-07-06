import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTaskITDto } from './create-task-it.dto'; // DTO des tâches IT

export class CreateSprintITDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Nom du sprint

  @IsDateString()
  startDate: string; // Date de début

  @IsDateString()
  endDate: string; // Date de fin

  @IsString()
  @IsOptional()
  status?: string; // planned, in_progress, completed, on_hold

  @IsInt()
  @IsOptional()
  totalStoryPoints?: number; // Capacité totale du sprint

  @IsString()
  @IsOptional()
  priority?: string; // High, Medium, Low

  @IsString()
  @IsOptional()
  risks?: string; // Risques identifiés

  @IsString()
  @IsOptional()
  dependencies?: string; // Dépendances avec d’autres modules/projets

  @IsInt()
  @IsOptional()
  teamSize?: number; // Nombre de membres affectés

  @IsString()
  @IsOptional()
  complexity?: string; // Low, Medium, High

  @IsString()
  @IsOptional()
  additionalNotes?: string; // Notes supplémentaires

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskITDto)
  tasks?: CreateTaskITDto[]; // Tableau des tâches du sprint
}
