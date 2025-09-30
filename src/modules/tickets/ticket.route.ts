import { FastifyInstance } from 'fastify';
import { createAuthHook } from '../../hooks/authHook';
import {
  createTicketHandler,
  getMyTicketsHandler,
  getAllTicketsHandler,
  updateTicketHandler,
} from './ticket.controller';
import {
  createTicketRequestSchema,
  getTicketRequestSchema,
  updateTicketRequestSchema,
} from './ticket.schema';

const adminOnlyHook = createAuthHook(['admin']);
const allUsersHook = createAuthHook(['admin', 'employee']);

async function ticketRoutes(server: FastifyInstance) {
  // Employee: สร้าง Ticket
  server.post(
    '/',
    { preHandler: [allUsersHook], schema: createTicketRequestSchema },
    createTicketHandler
  );

  // Employee: ดู Ticket ของตัวเอง
  server.get('/me', { preHandler: [allUsersHook] }, getMyTicketsHandler);

  // Admin: ดู Ticket ทั้งหมด
  server.get('/', { preHandler: [adminOnlyHook] }, getAllTicketsHandler);

  // Admin: อัปเดต Ticket
  server.patch(
    '/:ticketId',
    { preHandler: [adminOnlyHook], schema: updateTicketRequestSchema },
    updateTicketHandler
  );
}

export default ticketRoutes;