import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from './geo.service';
import { IsNumber, IsString, Min, Max } from 'class-validator';

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
  @IsString()
  query: string;
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
  async search(@Query() query: SearchPlacesDto) {
    return this.geoService.searchPlaces(query.query);
  }
}
