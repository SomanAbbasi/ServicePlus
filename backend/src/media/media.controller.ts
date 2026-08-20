import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
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
  async getFile(
    @Req() req: Request,
    @Param() params: Record<string, any>,
    @Res() res: Response,
  ) {
    const raw = params['path'] || params['0'] || params['splat'];
    let chosenPath = '';
    if (Array.isArray(raw)) {
      chosenPath = raw.join('/');
    } else if (typeof raw === 'string') {
      chosenPath = raw;
    } else if (req.path) {
      chosenPath = req.path.replace(/^.*\/media\/file\/?/, '');
    }
    const cleanPath = decodeURIComponent(chosenPath || '').replace(/^\/+/, '');

    const file = await this.mediaService.getFile(cleanPath);
    if (!file) throw new NotFoundException('File not found');

    res.setHeader('Content-Type', file.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(file.buffer);
  }
}
