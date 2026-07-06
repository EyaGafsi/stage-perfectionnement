
import { PartialType } from '@nestjs/mapped-types';
import { CreateSprintITDto } from './create-sprint-it.dto';

export class UpdateSprintITDto extends PartialType(CreateSprintITDto) {}