import { FastifyInstance } from 'fastify';
import { createAuthHook } from '../../hooks/authHook.js';
import {
  createTicketHandler,
  getMyTicketsHandler,
  getAllTicketsHandler,
  updateTicketHandler,
} from './ticket.controller.js';
import {
  createTicketRequestSchema,
  getTicketRequestSchema,
  updateTicketRequestSchema,
} from './ticket.schema.js';

const adminOnlyHook = createAuthHook(['admin']);
const allUsersHook = createAuthHook(['admin', 'employee']);

async function ticketRoutes(server: FastifyInstance) {
  // Employee: สร้าง Ticket
  server.post<{
    Body: {
      title: string;
      description: string;
      category: 'equipment_failure' | 'it_support' | 'safety_concern' | 'other';
      priority: 'low' | 'medium' | 'high';
    };
  }>(
    '/',
    { preHandler: [allUsersHook], schema: createTicketRequestSchema as any },
    createTicketHandler
  );

  // Employee: ดู Ticket ของตัวเอง
  server.get('/me', { preHandler: [allUsersHook] }, getMyTicketsHandler);

  // Admin: ดู Ticket ทั้งหมด
  server.get('/', { preHandler: [adminOnlyHook] }, getAllTicketsHandler);

  // Admin: อัปเดต Ticket
  server.patch<{ Params: { ticketId: string }; Body: { status?: 'open' | 'in_progress' | 'resolved' | 'closed'; assignedToId?: string } }>(
    '/:ticketId',
    { preHandler: [adminOnlyHook], schema: updateTicketRequestSchema  as any },
    updateTicketHandler
  );
}

export default ticketRoutes;