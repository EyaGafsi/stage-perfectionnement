import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TaskHistory extends Document {
  @Prop({ required: true })
  taskId: number;

  @Prop({ required: true })
  status: string; // Status de la tâche

  @Prop({ enum: ['IT', 'Marketing', 'CallCenter'], default: 'IT' })
  domain: string; // Domaine de la tâche

  @Prop({ type: Date, default: () => new Date() })
  changedAt: Date;
}

export const TaskHistorySchema = SchemaFactory.createForClass(TaskHistory);