import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { BookingModule } from './booking/booking.module';
import { AdminModule } from './admin/admin.module';
import { GeoModule } from './geo/geo.module';
import { MediaModule } from './media/media.module';
import { AvailabilityModule } from './availability/availability.module';
import { PricingModule } from './pricing/pricing.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ServicesModule,
    BookingModule,
    AdminModule,
    GeoModule,
    MediaModule,
    AvailabilityModule,
    PricingModule,
  ],
})
export class AppModule {}
