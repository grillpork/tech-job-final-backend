import { FastifyInstance } from 'fastify';
import { loginHandler } from './auth.controller';
import { loginSchema } from './auth.schema';

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