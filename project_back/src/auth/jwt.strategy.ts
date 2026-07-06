import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from 'src/user/entities/user.entity';

interface JwtPayload {
  sub: number;          // userId
  email: string;
  role: UserRole;
  companyId?: number | null;
  iat?: number;
  exp?: number;
}

export interface JwtValidatedUser {
  id: number;
  email: string;
  role: UserRole;
  companyId?: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.ACCESS_TOKEN_SECRET_KEY,
    });

    // ⚠️ Debug (à supprimer en prod)
    console.log(
      '[JwtStrategy] constructed — ACCESS_TOKEN_SECRET_KEY present:',
      !!process.env.ACCESS_TOKEN_SECRET_KEY,
    );
  }

  async validate(payload: JwtPayload): Promise<JwtValidatedUser> {
    // ⚠️ Debug (à supprimer en prod)
    console.log('[JwtStrategy] validate payload:', payload);

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId ?? null,
    };
  }
}
