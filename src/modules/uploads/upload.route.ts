import { FastifyInstance } from 'fastify';
import { createAuthHook } from '../../hooks/authHook.js';
import { uploadImageHandler } from './upload.controller.js';

const allUsersHook = createAuthHook(['admin', 'employee']);

async function uploadRoutes(server: FastifyInstance) {
  server.post(
    '/image',
    {
      preHandler: [allUsersHook], 
    },
    uploadImageHandler
  );
}

export default uploadRoutes;