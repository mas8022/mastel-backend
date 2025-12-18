import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import * as mime from 'mime-types';

@Injectable()
export class BucketService {
  private s3 = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.LIARA_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.LIARA_ACCESS_KEY!,
      secretAccessKey: process.env.LIARA_SECRET_KEY!,
    },
  });

  async uploadFile(file: any): Promise<string | null> {
    if (!file) return null;

    const ext = `.${mime.extension(file.mimetype) || 'bin'}`;
    const fileName = `${Date.now()}_${crypto.randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.LIARA_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `https://${process.env.LIARA_BUCKET_NAME}.storage.iran.liara.space/${fileName}`;
  }
}
