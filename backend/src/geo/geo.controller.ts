import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from './geo.service';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

class ReverseGeocodeDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

class SearchPlacesDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  q?: string;
}

@Controller('geo')
export class GeoController {
  constructor(private geoService: GeoService) {}

  @Get('reverse')
  async reverse(@Query() query: ReverseGeocodeDto) {
    const address = await this.geoService.reverseGeocode(
      query.lat,
      query.lng,
    );
    return { address };
  }

  @Get('search')
  async search(@Query() dto: SearchPlacesDto) {
    const text = dto.query || dto.q || '';
    return this.geoService.searchPlaces(text);
  }
}
