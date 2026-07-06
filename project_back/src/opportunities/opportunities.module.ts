import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpportunitiesService } from './opportunities.service';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunityEntity } from './entities/opportunity.entity';
import { LeadInformationEntity } from 'src/leads/entities/lead.entity';
import { UserEntity } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OpportunityEntity,    // table opportunities
      LeadInformationEntity, // table leads
      UserEntity,           // table users
    ]),
  ],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
})
export class OpportunitiesModule {}
