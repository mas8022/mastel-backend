import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
  namespace: '/call',
})
export class CallGateway {
  @SubscribeMessage('call-user')
  callUser(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
    client.to(body.to).emit('incoming-call', body);
  }

  @SubscribeMessage('accept-call')
  acceptCall(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
    client.to(body.to).emit('call-accepted', body.signal);
  }

  @SubscribeMessage('end-call')
  endCall(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
    client.to(body.to).emit('call-ended');
  }
}
