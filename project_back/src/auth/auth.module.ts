import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import { CompaniesModule } from '../companies/companies.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => CompaniesModule),
    forwardRef(() => ProjectsModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('ACCESS_TOKEN_SECRET_KEY');
        if (!secret) {
          throw new Error('ACCESS_TOKEN_SECRET_KEY is not defined in environment variables');
        }

        const expiresIn = configService.get<string>('ACCESS_TOKEN_EXPIRES_IN') || '1d';

        return {
          secret,
          signOptions: {
            // ⚡️ Ici on cast en StringValue pour éviter l'erreur TS
            expiresIn: expiresIn as unknown as '1d',
          },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
