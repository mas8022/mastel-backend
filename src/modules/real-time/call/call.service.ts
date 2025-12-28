import { Injectable } from '@nestjs/common';

@Injectable()
export class CallService {
  create() {
    return 'This action adds a new call';
  }
}
