import { IsNotEmpty, IsString } from 'class-validator';

export class UploadVideoDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}
