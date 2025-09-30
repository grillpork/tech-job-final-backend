import { z } from 'zod';
import { ticketCategoryEnum, ticketPriorityEnum, ticketStatusEnum } from '../../db/schema';

const ticketCore = {
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Please provide a detailed description."),
  category: z.enum(ticketCategoryEnum.enumValues),
  priority: z.enum(ticketPriorityEnum.enumValues),
};

const createTicketSchema = z.object(ticketCore);

const ticketParamsSchema = z.object({
  ticketId: z.string().uuid(),
});

const updateTicketSchema = z.object({
  status: z.enum(ticketStatusEnum.enumValues).optional(),
  assignedToId: z.string().uuid().optional(),
});

export const createTicketRequestSchema = z.object({
  body: createTicketSchema,
});

export const getTicketRequestSchema = z.object({
  params: ticketParamsSchema,
});

export const updateTicketRequestSchema = z.object({
  body: updateTicketSchema,
  params: ticketParamsSchema,
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;