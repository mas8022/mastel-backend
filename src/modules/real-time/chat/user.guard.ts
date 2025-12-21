import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UsersService } from 'src/modules/http-api/users/users.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly userService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const rawCookies: any = client.handshake.headers.cookie;

    const user = await this.userService.getMe(rawCookies);

    if (!user) {
      client.disconnect(true);
      return false;
    }

    client.data.user = user;

    return true;
  }
}
