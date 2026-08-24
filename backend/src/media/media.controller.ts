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
  Logger,
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
  private readonly logger = new Logger(MediaController.name);

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

  @Post('delete')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteFile(@Body() dto: { url?: string; path?: string }) {
    const target = dto?.url || dto?.path;
    if (!target) return { ok: false };
    const ok = await this.mediaService.deleteFile(target);
    return { ok };
  }

  @Get('file/*path')
  async getFile(
    @Req() req: Request,
    @Param() params: Record<string, any>,
    @Res() res: Response,
  ) {
    try {
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
      if (!file) {
        return res.status(404).json({ statusCode: 404, message: 'File not found' });
      }

      res.setHeader('Content-Type', file.contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(file.buffer);
    } catch (e: any) {
      this.logger.error(`Error serving media file: ${e?.message || e}`);
      return res.status(500).json({ statusCode: 500, message: 'Could not retrieve media file' });
    }
  }
}
