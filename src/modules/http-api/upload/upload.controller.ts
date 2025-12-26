import { Controller, Post, Body } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadVideoDto } from './dto/upload-video.dto';
import { UploadVoiceDto } from './dto/upload-voice.dto';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('video')
  async uploadVideo(@Body() body: UploadVideoDto) {
    return this.uploadService.uploadVideo(body);
  }

  @Post('voice')
  async uploadVoice(@Body() body: UploadVoiceDto) {
    return this.uploadService.uploadVoice(body);
  }

  @Post('file')
  async uploadFile(@Body() body: UploadFileDto) {
    return this.uploadService.uploadFile(body);
  }
}
