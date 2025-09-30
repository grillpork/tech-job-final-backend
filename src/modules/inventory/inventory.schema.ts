import { db } from "@/db";
import { inventoryItems, itemTypeEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createRequestSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().positive("Quantity must be a positive number"),
  reason: z.string().optional(),
  jobId: z.string().uuid().optional(), // Optional: link request to a job
});

export const createRequestRequestSchema = z.object({
  body: createRequestSchema,
});

const requestParamsSchema = z.object({
  requestId: z.string().uuid(),
});

export const manageRequestRequestSchema = z.object({
  params: requestParamsSchema,
});

const itemParamsSchema = z.object({
  itemId: z.string().uuid(),
});

const updateItemQuantitySchema = z.object({
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
});

const updateItemSchema = z
  .object({
    name: z.string().min(3).optional(), //  <-- เพิ่ม name เป็น optional
    quantity: z.number().int().min(0, "Quantity cannot be negative").optional(), // <-- ทำให้ quantity เป็น optional ด้วย
  })
  .refine((data) => data.name || data.quantity, {
    // <-- เพิ่ม refine เพื่อให้แน่ใจว่ามีอย่างน้อยหนึ่งฟิลด์ถูกส่งมา
    message: "Either name or quantity must be provided",
  });

export const updateItemRequestSchema = z.object({
  body: updateItemSchema,
  params: itemParamsSchema,
});

const createItemSchema = z.object({
  name: z.string({ required_error: "Item name is required" }).min(3),
  quantity: z.number().int().min(0).optional().default(0),
});

export const createItemRequestSchema = z.object({
  body: createItemSchema,
});

const updateItemTypeSchema = z.object({
  type: z.enum(itemTypeEnum.enumValues),
});

export const updateItemTypeRequestSchema = z.object({
  body: updateItemTypeSchema,
  params: itemParamsSchema, // ใช้ itemParamsSchema เดิมที่เรามีอยู่แล้ว
});

// Service สำหรับ Admin ลบสินค้า
export async function deleteInventoryItem(itemId: string) {
  const [deletedItem] = await db
    .delete(inventoryItems)
    .where(eq(inventoryItems.id, itemId))
    .returning({ id: inventoryItems.id });
  return deletedItem;
}
export type UpdateItemTypeInput = z.infer<typeof updateItemTypeSchema>;
export type UpdateItemQuantityInput = z.infer<typeof updateItemQuantitySchema>;
export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;