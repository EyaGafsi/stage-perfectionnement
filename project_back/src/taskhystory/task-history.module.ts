import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskHistory, TaskHistorySchema } from './shema/task-history.schema';
import { TaskHistoryService } from './task-history.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskHistory.name, schema: TaskHistorySchema },
    ]),
  ],
  providers: [TaskHistoryService],
  exports: [TaskHistoryService],
})
export class TaskHistoryModule {}