import { db } from '../../db/index.js';
import { tickets } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { CreateTicketInput, UpdateTicketInput } from './ticket.schema.js';

// Service สำหรับ Employee สร้าง Ticket
export async function createTicket(input: CreateTicketInput, reporterId: string) {
  const [newTicket] = await db
    .insert(tickets)
    .values({
      ...input,
      reportedById: reporterId,
    })
    .returning();
  return newTicket;
}

// Service สำหรับ Employee ดู Ticket ของตัวเอง
export async function getMyTickets(userId: string) {
  return db.query.tickets.findMany({
    where: eq(tickets.reportedById, userId),
    with: {
      assignee: { columns: { name: true } },
    },
    orderBy: [desc(tickets.createdAt)],
  });
}

// Service สำหรับ Admin ดู Ticket ทั้งหมด
export async function getAllTickets() {
  return db.query.tickets.findMany({
    with: {
      reporter: { columns: { name: true } },
      assignee: { columns: { name: true } },
    },
    orderBy: [desc(tickets.createdAt)],
  });
}

// Service สำหรับ Admin อัปเดต Ticket (สถานะ/ผู้รับผิดชอบ)
export async function updateTicket(ticketId: string, data: UpdateTicketInput) {
  const [updatedTicket] = await db
    .update(tickets)
    .set(data)
    .where(eq(tickets.id, ticketId))
    .returning();
  return updatedTicket;
}