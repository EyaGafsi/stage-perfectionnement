import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './entities/project.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { UserModule } from '../user/user.module';
import { CompaniesModule } from '../companies/companies.module';
import { AuthModule } from '../auth/auth.module';
import { UserEntity } from 'src/user/entities/user.entity';
import { ProjectITEntity } from './entities/projectIT.entity';
import { ProjectMarketingEntity } from './entities/projectMarketing.entity';
import { ProjectCallCenterEntity } from './entities/projectCallCenter.entity';
import { TaskITEntity } from './entities/TaskITEntity.entity';
import { SprintITEntity } from './entities/SprintITEntity.entity';
import { SprintMarketingEntity } from './entities/SprintMarketingEntity.entity';
import { TaskMarketingEntity } from './entities/TaskMarketingEntity.entity';
import { SprintCallCenterEntity } from './entities/SprintCallCenterEntity.entity';
import { TaskCallCenterEntity } from './entities/TaskCallCenterEntity.entity';
import { TaskHistoryModule } from 'src/taskhystory/task-history.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, UserEntity, ProjectITEntity, ProjectMarketingEntity, ProjectCallCenterEntity,TaskITEntity,SprintITEntity,SprintMarketingEntity,TaskMarketingEntity,SprintCallCenterEntity,TaskCallCenterEntity]),
    forwardRef(() => UserModule),
    forwardRef(() => CompaniesModule),
    forwardRef(() => AuthModule),
    forwardRef(() => TaskHistoryModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}