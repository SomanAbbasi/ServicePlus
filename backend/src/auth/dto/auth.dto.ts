import { IsString, IsOptional, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/)
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/)
  phone: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
