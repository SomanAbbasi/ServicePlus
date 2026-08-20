import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { PricingModule } from '../pricing/pricing.module';
import { AvailabilityModule } from '../availability/availability.module';
import { ProvidersModule } from '../common/providers.module';

@Module({
  imports: [PricingModule, AvailabilityModule, ProvidersModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
