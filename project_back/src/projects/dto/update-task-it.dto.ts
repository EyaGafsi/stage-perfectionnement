// ─── update-task-it.dto.ts ───────────────────────────────────────────────────
// PartialType makes every field from CreateTaskITDto optional.
// No extra work needed — the fixes are in CreateTaskITDto.
import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskITDto } from './create-task-it.dto';

export class UpdateTaskITDto extends PartialType(CreateTaskITDto) {}