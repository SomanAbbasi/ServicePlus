import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { IsString, IsOptional } from 'class-validator';

class SearchDto {
  @IsString()
  q: string;
}

@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  async getAll() {
    return this.servicesService.getAllServices();
  }

  @Get('home-catalog')
  async homeCatalog() {
    return this.servicesService.getHomeCatalog();
  }

  @Get('search')
  async search(@Query() query: SearchDto) {
    return this.servicesService.searchServices(query.q);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.servicesService.getServiceBySlug(slug);
  }
}

@Controller('categories')
export class CategoriesController {
  constructor(private servicesService: ServicesService) {}

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.servicesService.getCategoryBySlug(slug);
  }
}

@Controller('cities')
export class CitiesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  async getAll() {
    return this.servicesService.getCities();
  }
}

@Controller('bundles')
export class BundlesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  async getAll() {
    return this.servicesService.getBundles();
  }
}
