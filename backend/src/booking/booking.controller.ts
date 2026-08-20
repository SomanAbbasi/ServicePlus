import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class VariantIdDto {
  @IsString()
  id: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  quantity: number;
}

class AddonIdDto {
  @IsString()
  id: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  quantity: number;
}

class QuoteDto {
  @IsString()
  serviceSlug: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  hours: number;

  @IsNumber()
  @Min(1)
  @Max(6)
  professionals: number;

  @IsBoolean()
  materials: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantIdDto)
  variantIds: VariantIdDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddonIdDto)
  addonIds: AddonIdDto[];

  @IsOptional()
  @IsString()
  couponCode?: string | null;

  @IsOptional()
  @IsString()
  citySlug?: string | null;

  @IsOptional()
  @IsString()
  frequency?: string | null;
}

class AvailabilityDto {
  @IsString()
  date: string;

  @IsNumber()
  @Min(30)
  @Max(720)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  citySlug?: string | null;
}

class CreateBookingDto extends QuoteDto {
  @IsString()
  addressId: string;

  @IsString()
  scheduledDate: string;

  @IsString()
  scheduledStart: string;

  @IsOptional()
  @IsString()
  instructions?: string | null;

  @IsString()
  paymentMethod: string;

  @IsString()
  idempotencyKey: string;
}

class CancelBookingDto {
  @IsString()
  bookingId: string;
}

class CreateAddressDto {
  @IsString()
  label: string;

  @IsString()
  street: string;

  @IsOptional()
  @IsString()
  building?: string;
}

@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post('quote')
  async quote(@Body() dto: QuoteDto) {
    return this.bookingService.getQuote(dto);
  }

  @Post('availability')
  async availability(@Body() dto: AvailabilityDto) {
    return this.bookingService.getAvailability(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-bookings')
  async myBookings(@Req() req: any) {
    return this.bookingService.getMyBookings(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancel(@Req() req: any, @Body() dto: CancelBookingDto) {
    return this.bookingService.cancelBooking(req.user.userId, dto.bookingId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('addresses')
  async getAddresses(@Req() req: any) {
    return this.bookingService.getMyAddresses(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('address')
  async createAddress(@Req() req: any, @Body() dto: CreateAddressDto) {
    return this.bookingService.createAddress(req.user.userId, dto);
  }
}
