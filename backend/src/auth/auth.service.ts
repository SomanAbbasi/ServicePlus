import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OTP_PROVIDER, OtpProvider } from '../common/providers/otp.provider';
import * as bcrypt from 'bcryptjs';

const PHONE_RE = /^\+?[0-9]{9,15}$/;

function normalizePhone(raw: string): string {
  const trimmed = String(raw).replace(/[^\d+]/g, '');
  if (!PHONE_RE.test(trimmed)) throw new Error('Enter a valid phone number');
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

function syntheticEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@phone.serviceplus.app`;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    @Inject(OTP_PROVIDER) private otpProvider: OtpProvider,
  ) {}

  private get exposeDevOtp(): boolean {
    return this.config.get<string>('NODE_ENV', 'development') === 'development';
  }

  private getAdminPhones(): string[] {
    const raw = this.config.get<string>('ADMIN_PHONES', '');
    if (!raw) return [];
    return raw
      .split(',')
      .map((p) => normalizePhone(p.trim()))
      .filter(Boolean);
  }

  private isAdminPhone(phone: string): boolean {
    return this.getAdminPhones().includes(phone);
  }

  private async ensureAdminRole(userId: string) {
    const existing = await this.prisma.userRole.findFirst({
      where: { userId, role: 'admin' },
    });
    if (!existing) {
      await this.prisma.userRole.create({
        data: { userId, role: 'admin' },
      });
    }
  }

  async sendOtp(phone: string) {
    const normalized = normalizePhone(phone);

    const since = new Date(Date.now() - 10 * 60_000);
    const recentCount = await this.prisma.otpCode.count({
      where: { phone: normalized, createdAt: { gte: since } },
    });
    if (recentCount >= 3) {
      throw new Error('Too many codes requested. Please wait a few minutes.');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);

    await this.prisma.otpCode.updateMany({
      where: { phone: normalized, consumed: false },
      data: { consumed: true },
    });

    await this.prisma.otpCode.create({
      data: {
        phone: normalized,
        codeHash,
        expiresAt: new Date(Date.now() + 5 * 60_000),
      },
    });

    await this.otpProvider.send(normalized, code);

    return { phone: normalized, devCode: this.exposeDevOtp ? code : null };
  }

  async verifyOtp(phone: string, code: string, name?: string) {
    const normalized = normalizePhone(phone);

    const row = await this.prisma.otpCode.findFirst({
      where: { phone: normalized, consumed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!row) throw new Error('Request a new code to continue.');
    if (row.expiresAt.getTime() < Date.now())
      throw new Error('That code expired. Request a new one.');
    if (row.attempts >= 5)
      throw new Error('Too many attempts. Request a new code.');

    const match = await bcrypt.compare(code, row.codeHash);
    if (!match) {
      await this.prisma.otpCode.update({
        where: { id: row.id },
        data: { attempts: row.attempts + 1 },
      });
      throw new Error('That code is incorrect.');
    }

    await this.prisma.otpCode.update({
      where: { id: row.id },
      data: { consumed: true },
    });

    const email = syntheticEmail(normalized);

    let profile = await this.prisma.profile.findFirst({
      where: { phone: normalized },
      include: { userRoles: true },
    });

    if (!profile) {
      profile = await this.prisma.profile.create({
        data: {
          phone: normalized,
          email,
          fullName: name ?? null,
          userRoles: {
            create: { role: 'customer' },
          },
        },
        include: { userRoles: true },
      });
    } else {
      if (name && !profile.fullName) {
        await this.prisma.profile.update({
          where: { id: profile.id },
          data: { fullName: name },
        });
        profile.fullName = name;
      }
      if (!profile.phone) {
        await this.prisma.profile.update({
          where: { id: profile.id },
          data: { phone: normalized },
        });
        profile.phone = normalized;
      }
    }

    if (this.isAdminPhone(normalized)) {
      await this.ensureAdminRole(profile.id);
      const refreshed = await this.prisma.profile.findFirst({
        where: { id: profile.id },
        include: { userRoles: true },
      });
      if (refreshed) profile = refreshed;
    }

    const tokens = await this.generateTokens(profile.id);
    return { ...tokens, profile };
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      include: { userRoles: true },
    });
    if (!profile) throw new UnauthorizedException('User not found');
    return profile;
  }

  async checkIsAdmin(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (profile?.phone && this.isAdminPhone(profile.phone)) {
      await this.ensureAdminRole(userId);
      return { isAdmin: true };
    }
    const role = await this.prisma.userRole.findFirst({
      where: { userId, role: 'admin' },
    });
    return { isAdmin: Boolean(role) };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
      const profile = await this.prisma.profile.findUnique({
        where: { id: payload.sub },
        include: { userRoles: true },
      });
      if (!profile) throw new UnauthorizedException();
      return this.generateTokens(profile.id);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string) {
    const accessToken = this.jwt.sign(
      { sub: userId },
      {
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as any,
      },
    );
    const refreshToken = this.jwt.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
      },
    );
    return { accessToken, refreshToken, userId };
  }
}
