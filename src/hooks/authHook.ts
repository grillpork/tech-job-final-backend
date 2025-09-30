import { FastifyRequest, FastifyReply } from 'fastify';
import { roleEnum } from '../db/schema';

type AllowedRoles = (typeof roleEnum.enumValues)[number][];

export const createAuthHook = (allowedRoles: AllowedRoles) => {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    // --- DEBUG LOGS START ---
    console.log('--- 🛡️ Auth Hook Triggered ---');
    console.log('Authorization Header received:', request.headers.authorization);
    // --- DEBUG LOGS END ---

    try {
      const user = await request.jwtVerify<{ id: string; role: string }>();

      if (!allowedRoles.includes(user.role as (typeof roleEnum.enumValues)[number])) {
        return reply.forbidden();
      }
      
      request.user = user;

    } catch (e) {
      // --- DEBUG LOGS START ---
      console.error('🔥 JWT Verification Error:', e); // ดู Error ที่แท้จริงจากตรงนี้
      // --- DEBUG LOGS END ---
      return reply.unauthorized();
    }
  };
};