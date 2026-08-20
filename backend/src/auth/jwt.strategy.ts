import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'change-me-in-production'),
    });
  }

  async validate(payload: { sub: string }) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: payload.sub },
      include: { userRoles: true },
    });
    if (!profile) throw new UnauthorizedException();
    return {
      userId: profile.id,
      profile,
      roles: profile.userRoles.map((r) => r.role),
    };
  }
}
