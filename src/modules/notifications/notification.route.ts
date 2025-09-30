import { FastifyInstance } from 'fastify';
import { createAuthHook } from '../../hooks/authHook';
import { getMyNotificationsHandler, markAsReadHandler } from './notification.controller';

const allUsersHook = createAuthHook(['admin', 'employee']);

async function notificationRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: [allUsersHook] }, getMyNotificationsHandler);
  
  server.post<{ Params: { notificationId: string } }>(
    '/:notificationId/read',
    { preHandler: [allUsersHook] },
    markAsReadHandler
  );
}

export default notificationRoutes;