export class SendMessageDto {
  contactId: string;

  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'VOICE';

  text?: string;

  fileUrl?: string;
  fileKey?: string;
  mimeType?: string;
  size?: number;
  duration?: number;

  replyToId?: number | null;
}
