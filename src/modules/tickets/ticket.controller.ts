import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateTicketInput, UpdateTicketInput } from './ticket.schema.js';
import { createTicket, getMyTickets, getAllTickets, updateTicket } from './ticket.service.js';

export async function createTicketHandler(
  request: FastifyRequest<{ Body: CreateTicketInput }>,
  reply: FastifyReply
) {
  const ticket = await createTicket(request.body, request.user.id);
  return reply.code(201).send(ticket);
}

export async function getMyTicketsHandler(request: FastifyRequest) {
  const userTickets = await getMyTickets(request.user.id);
  return userTickets;
}

export async function getAllTicketsHandler() {
  const allTickets = await getAllTickets();
  return allTickets;
}

export async function updateTicketHandler(
  request: FastifyRequest<{ Params: { ticketId: string }; Body: UpdateTicketInput }>,
  reply: FastifyReply
) {
  const updatedTicket = await updateTicket(request.params.ticketId, request.body);
  if (!updatedTicket) {
    return reply.notFound('Ticket not found');
  }
  return updatedTicket;
}