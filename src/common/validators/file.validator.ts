import { BadRequestException } from '@nestjs/common';

export class FileValidator {
  static validateJpgFile(file: any) {
    if (!file) {
      throw new BadRequestException('هیچ فایلی ارسال نشده است');
    }

    if (file.mimetype !== 'image/jpeg') {
      throw new BadRequestException('فقط فایل‌هایی با فرمت .jpg مجاز هستند');
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('حجم فایل نباید بیشتر از ۲ مگابایت باشد');
    }

    return true;
  }
}
