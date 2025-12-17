import {
  Controller,
  Get,
  Headers,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserGuard } from './user.guard';
import type { FastifyRequest } from 'fastify';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('find-users/:search')
  async findUsers(@Param('search') search: string) {
    return await this.usersService.findUsers(search);
  }

  @Get('me')
  async getMe(@Headers('cookie') rawCookie: string) {
    return this.usersService.getMe(rawCookie);
  }

  @UseGuards(UserGuard)
  @Get('contacts')
  async getContact(@Req() req: FastifyRequest) {
    return await this.usersService.getContact(req);
  }
}
