import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberProfileEntity } from './entities/member-profile.entity';
import { MemberProfileService } from './member-profile.service';
import { MemberProfileScoringService } from './member-profile-scoring.service';
import { MemberProfileController } from './member-profile.controller';
import { UserEntity } from 'src/user/entities/user.entity';

// Entités des tâches des 3 domaines (nécessaires pour le scoring)
import { TaskITEntity } from 'src/projects/entities/TaskITEntity.entity';
import { TaskMarketingEntity } from 'src/projects/entities/TaskMarketingEntity.entity';
import { TaskCallCenterEntity } from 'src/projects/entities/TaskCallCenterEntity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MemberProfileEntity,
      UserEntity,
      // ← Repositories injectés dans MemberProfileScoringService
      TaskITEntity,
      TaskMarketingEntity,
      TaskCallCenterEntity,
    ]),
  ],
  controllers: [MemberProfileController],
  providers: [
    MemberProfileService,
    MemberProfileScoringService, // ← nouveau service
  ],
  exports: [MemberProfileService, MemberProfileScoringService],
})
export class MemberProfileModule {}