import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserGuard } from './user.guard';
import type { FastifyRequest } from 'fastify';
import {
  FileFieldsInterceptor,
  UploadedFiles,
} from '@blazity/nest-file-fastify';
import { EditProfileDto } from './dto/edit-profile.dto';

@UseGuards(UserGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Headers('cookie') rawCookie: string) {
    const me = await this.usersService.getMe(rawCookie);
    return me ? { status: 200, data: me } : { status: 500, data: null };
  }

  @Get('find-users/:search')
  async findUsers(@Param('search') search: string, @Req() req: FastifyRequest) {
    return await this.usersService.findUsers(search, req);
  }

  @Get('contacts')
  async getContacts(@Req() req: FastifyRequest) {
    return await this.usersService.getContacts(req);
  }

  @UseInterceptors(FileFieldsInterceptor([{ name: 'avatar', maxCount: 1 }]))
  @Put('profile')
  async editProfile(
    @Req() req: FastifyRequest,
    @UploadedFiles() files: any,
    @Body() body: EditProfileDto,
  ) {
    return await this.usersService.editProfile(req, files, body);
  }

  @Get('contact/:id')
  async getContact(@Param('id') id: string) {
    return await this.usersService.getContact(id);
  }
}
