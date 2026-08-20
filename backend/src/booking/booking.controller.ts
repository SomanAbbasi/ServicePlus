import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/auth.guard';
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

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateBookingDto) {
    const userId = req.user?.userId || req.user?.id;
    return this.bookingService.createBooking(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-bookings')
  async myBookings(@Req() req: any) {
    return this.bookingService.getMyBookings(req.user.userId || req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancel(@Req() req: any, @Body() dto: CancelBookingDto) {
    return this.bookingService.cancelBooking(req.user.userId || req.user.id, dto.bookingId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('addresses')
  async getAddresses(@Req() req: any) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return [];
    return this.bookingService.getMyAddresses(userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('address')
  async createAddress(@Req() req: any, @Body() dto: CreateAddressDto) {
    const userId = req.user?.userId || req.user?.id;
    return this.bookingService.createAddress(userId, dto);
  }
}
