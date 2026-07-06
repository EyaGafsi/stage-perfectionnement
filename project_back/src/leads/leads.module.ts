import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadInformationEntity } from './entities/lead.entity';
import { LeadQualificationEntity } from './entities/leadqualification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeadInformationEntity, LeadQualificationEntity]),
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService], 
})
export class LeadsModule {}
