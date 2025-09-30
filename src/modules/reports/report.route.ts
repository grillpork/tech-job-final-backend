import { FastifyInstance } from 'fastify';
import { createAuthHook } from '../../hooks/authHook.js';
import {
    getCompletedJobsTrendHandler,
  getEmployeeProductivityHandler,
  getTopItemsHandler,
} from './report.controller.js';
import { getTrendRequestSchema } from './report.schema.js';

const adminOnlyHook = createAuthHook(['admin']);

async function reportRoutes(server: FastifyInstance) {
  server.get(
    '/employee-productivity',
    {
      preHandler: [adminOnlyHook], // เฉพาะ Admin เท่านั้น
    },
    getEmployeeProductivityHandler
  );
  server.get(
    '/top-inventory-items',
    {
      preHandler: [adminOnlyHook],
    },
    getTopItemsHandler
  );

  server.get<{ Querystring: { period: 'day' | 'month' | 'year' } }>(
    '/completed-jobs-trend',
    {
      preHandler: [adminOnlyHook],
      schema: getTrendRequestSchema as any, // ใช้ schema ที่ถูกต้อง
    },
    getCompletedJobsTrendHandler
  );
}

export default reportRoutes;
