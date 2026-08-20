import { Module } from '@nestjs/common';
import { PricingServiceEngine } from './pricing.service';

@Module({
  providers: [PricingServiceEngine],
  exports: [PricingServiceEngine],
})
export class PricingModule {}
