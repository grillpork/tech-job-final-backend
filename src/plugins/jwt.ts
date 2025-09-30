// /src/plugins/jwt.ts

import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config';

async function jwtPlugin(server: FastifyInstance) {
  // เพิ่ม log ตรงนี้เพื่อดูว่า plugin ได้รับ secret จริงหรือไม่
  console.log('🔒 Initializing JWT plugin with secret:', config.JWT_SECRET);

  server.register(fastifyJwt, {
    secret: config.JWT_SECRET,
  });
}

export default fastifyPlugin(jwtPlugin);