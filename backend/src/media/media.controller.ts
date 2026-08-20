import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { IsString } from 'class-validator';

class UploadMediaDto {
  @IsString()
  filename: string;

  @IsString()
  contentType: string;

  @IsString()
  dataBase64: string;
}

@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async upload(@Body() dto: UploadMediaDto) {
    return this.mediaService.upload(
      dto.filename,
      dto.contentType,
      dto.dataBase64,
    );
  }

  @Get('file/*path')
  async getFile(@Param('path') pathStr: string | string[], @Res() res: Response) {
    const rawPath = Array.isArray(pathStr) ? pathStr.join('/') : pathStr;
    const file = await this.mediaService.getFile(rawPath);
    if (!file) throw new NotFoundException('File not found');
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(file.buffer);
  }

}
