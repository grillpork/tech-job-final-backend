import { FastifyInstance } from 'fastify';
import { loginHandler } from './auth.controller.js';
import { loginSchema } from './auth.schema.js';

async function authRoutes(server: FastifyInstance) {
  server.post(
    '/login',
    {
      schema: {
        body: loginSchema,
      },
    },
    loginHandler
  );
}

export default authRoutes;