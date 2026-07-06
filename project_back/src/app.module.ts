import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import{TypeOrmModule} from '@nestjs/typeorm';
import { dataSourceOptions } from 'db/data-source';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { CompaniesModule } from './companies/companies.module';
import { LeadsModule } from './leads/leads.module';
import { CallsModule } from './calls/calls.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permission/permission.module';
import { PostsModule } from './post/post.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskHistoryModule } from './taskhystory/task-history.module'
import { MemberProfileModule } from './member-profile/member-profile.module'; 
import { config } from 'dotenv';

config();
@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions),
     ConfigModule.forRoot({
      isGlobal: true, // permet d'utiliser process.env partout
    }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    UserModule,
    AuthModule,
    ProjectsModule,
    CompaniesModule,
    LeadsModule,
    CallsModule,
    OpportunitiesModule,
    RolesModule,
    PermissionsModule,
    PostsModule,
     TaskHistoryModule,
     MemberProfileModule
 ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
