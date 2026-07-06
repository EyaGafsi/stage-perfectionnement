import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { CallEntity } from './entities/call.entity';
import { LeadInformationEntity } from 'src/leads/entities/lead.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { ScriptEntity } from './entities/scripts.entity';
import { ScriptsService } from './scripts.service';
import { ScriptsController } from './scripts.controller';
@Module({
  imports: [TypeOrmModule.forFeature([CallEntity, LeadInformationEntity, UserEntity, ScriptEntity])],
  controllers: [CallsController, ScriptsController],
  providers: [CallsService, ScriptsService ],
})
export class CallsModule {}
