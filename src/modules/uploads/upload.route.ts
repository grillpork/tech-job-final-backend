import { FastifyInstance } from 'fastify';
import { createAuthHook } from '../../hooks/authHook';
import { uploadImageHandler } from './upload.controller';

const allUsersHook = createAuthHook(['admin', 'employee']);

async function uploadRoutes(server: FastifyInstance) {
  server.post(
    '/image',
    {
      preHandler: [allUsersHook], // ต้องล็อกอินก่อนถึงจะอัปโหลดได้
    },
    uploadImageHandler
  );
}

export default uploadRoutes;