import { FastifyInstance } from 'fastify';
import {
  getAllUsersHandler,
  getMeHandler,
  updateAvatarHandler,
  updateUserHandler,
  updateUserStatusHandler,
} from './user.controller';
import { createAuthHook } from '../../hooks/authHook';
import {
  updateUserAvatarRequestSchema,
  updateUserRequestSchema,
  updateUserStatusRequestSchema,
} from './user.schema';
// import { updateUserAvatarRequestSchema } from './user.schema';

// สร้าง Hook โดยระบุว่าทั้ง 'admin' และ 'employee' สามารถเข้าถึงได้
const authAllUsersHook = createAuthHook(['admin', 'employee']);
const adminOnlyHook = createAuthHook(['admin']);
async function userRoutes(server: FastifyInstance) {
  server.get(
    '/me',
    {
      // preHandler จะทำงานก่อนที่ controller จะทำงาน
      // เราใช้ hook ที่นี่เพื่อตรวจสอบ JWT และสิทธิ์
      preHandler: [authAllUsersHook],
    },
    getMeHandler
  );

  server.get('/', { preHandler: [adminOnlyHook] }, getAllUsersHandler);

  // Route สำหรับอัปเดต URL รูปโปรไฟล์
  server.put(
    '/me/avatar',
    {
      preHandler: [authAllUsersHook],
      // schema: updateUserAvatarRequestSchema,
    },
    updateAvatarHandler
  );

  server.patch(
    '/:userId',
    {
      preHandler: [adminOnlyHook],
      schema: updateUserRequestSchema,
    },
    updateUserHandler
  );

  server.patch(
    '/:userId/status',
    {
      preHandler: [adminOnlyHook],
      schema: updateUserStatusRequestSchema,
    },
    updateUserStatusHandler
  );
}

export default userRoutes;
