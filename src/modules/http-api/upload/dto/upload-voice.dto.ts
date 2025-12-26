import { IsString, IsNotEmpty } from 'class-validator';

export class UploadVoiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}
