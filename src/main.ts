import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import helmet from '@fastify/helmet';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({ trustProxy: true });

  await fastifyAdapter.register(fastifyCookie, {
    secret: process.env.FASTIFY_COOKIE_SECRET,
  });
  await fastifyAdapter.register(multipart);

  await fastifyAdapter.register(helmet);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
