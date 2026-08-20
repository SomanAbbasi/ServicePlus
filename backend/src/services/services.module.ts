import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import {
  ServicesController,
  CategoriesController,
  CitiesController,
  BundlesController,
} from './services.controller';

@Module({
  controllers: [
    ServicesController,
    CategoriesController,
    CitiesController,
    BundlesController,
  ],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
