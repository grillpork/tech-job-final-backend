import { db } from "../../db/index.js";
import { inventoryItems, inventoryRequests } from "../../db/schema.js";
import { eq, and, sql, gt } from "drizzle-orm";
import {
  CreateItemInput,
  CreateRequestInput,
  UpdateItemInput,
  UpdateItemTypeInput,
} from "./inventory.schema.js";

// Service สำหรับดึงรายการสินค้าทั้งหมดในคลัง
export async function getAllInventoryItems() {
  return db.query.inventoryItems.findMany({
    columns: {
      id: true,
      name: true,
      quantity: true,
      type: true, 
      lastRestockDate: true, 
    },
  });
}

// Service สำหรับสร้างคำขอเบิกใหม่ (เวอร์ชันปรับปรุง)
export async function createInventoryRequest(
  input: CreateRequestInput,
  requesterId: string
) {
  return db.transaction(async (tx) => {
    // 1. ค้นหาสินค้าและจำนวนคงเหลือ
    const item = await tx.query.inventoryItems.findFirst({
      where: eq(inventoryItems.id, input.itemId),
    });

    // 2. ตรวจสอบว่ามีของพอหรือไม่
    if (!item || item.quantity < input.quantity) {
      // ถ้าของไม่มี หรือมีไม่พอ ให้โยน Error เพื่อยกเลิก Transaction
      throw new Error("Insufficient stock available.");
    }

    // 3. ถ้าของพอ ให้ลดจำนวนในสต็อก (สำรองของ)
    const newQuantity = item.quantity - input.quantity;
    await tx
      .update(inventoryItems)
      .set({ quantity: newQuantity })
      .where(eq(inventoryItems.id, input.itemId));

    // 4. สร้างคำขอเบิก
    const [newRequest] = await tx
      .insert(inventoryRequests)
      .values({
        ...input,
        requesterId: requesterId,
      })
      .returning();

    return newRequest;
  });
}

// Service สำหรับให้พนักงานดูประวัติการเบิกของตัวเอง
export async function getMyRequests(userId: string) {
  return db.query.inventoryRequests.findMany({
    where: eq(inventoryRequests.requesterId, userId),
    with: {
      item: {
        // ดึงชื่อสินค้ามาแสดงด้วย
        columns: {
          name: true,
        },
      },
    },
    orderBy: (req: { requestedAt: any; }, { desc }: any) => [desc(req.requestedAt)],
  });
}

// --- SERVICES FOR ADMIN ---

// Service สำหรับ Admin ดึงคำขอเบิกทั้งหมด (เช่นเฉพาะที่ยัง pending)
export async function getAllPendingRequests() {
  return db.query.inventoryRequests.findMany({
    where: eq(inventoryRequests.status, "pending"),
    with: {
      requester: { columns: { name: true } },
      item: { columns: { name: true } },
    },
    orderBy: (req: { requestedAt: any; }, { asc }: any) => [asc(req.requestedAt)],
  });
}

// Service สำหรับ Admin อนุมัติคำขอ
export async function approveRequest(requestId: string) {
  // ไม่ต้องทำอะไรกับสต็อก เพราะเราหักไปแล้วตอนขอ
  // แค่อัปเดตสถานะของคำขอเป็น 'approved'
  const [approvedRequest] = await db
    .update(inventoryRequests)
    .set({ status: "approved" })
    .where(eq(inventoryRequests.id, requestId))
    .returning();

  // (Optional) สร้าง notification แจ้งเตือนพนักงานว่าคำขออนุมัติแล้ว

  return approvedRequest;
}

// Service สำหรับ Admin ปฏิเสธคำขอ
export async function rejectRequest(requestId: string) {
  // ใช้ transaction เพื่อให้แน่ใจว่าการคืนของเข้าสต็อกและการอัปเดตสถานะสำเร็จพร้อมกัน
  return db.transaction(async (tx) => {
    // 1. ค้นหาคำขอเพื่อดูว่าขออะไรไปเท่าไหร่
    const request = await tx.query.inventoryRequests.findFirst({
      where: eq(inventoryRequests.id, requestId),
    });

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Can only reject pending requests");
    }

    // 2. บวกจำนวนสินค้าคืนกลับเข้าสต็อก
    await tx
      .update(inventoryItems)
      .set({
        quantity: sql`${inventoryItems.quantity} + ${request.quantity}`,
      })
      .where(eq(inventoryItems.id, request.itemId));

    // 3. อัปเดตสถานะของคำขอเป็น 'rejected'
    const [rejectedRequest] = await tx
      .update(inventoryRequests)
      .set({ status: "rejected" })
      .where(eq(inventoryRequests.id, requestId))
      .returning();

    // (Optional) สร้าง notification แจ้งเตือนพนักงานว่าคำขอถูกปฏิเสธ

    return rejectedRequest;
  });
}

// Service สำหรับ Admin อัปเดตจำนวนสินค้า
export async function updateItemQuantity(itemId: string, newQuantity: number) {
  const [updatedItem] = await db
    .update(inventoryItems)
    .set({
      quantity: newQuantity,
      lastRestockDate: new Date().toISOString().split("T")[0],
    })
    .where(eq(inventoryItems.id, itemId))
    .returning();

  return updatedItem;
}

// Service สำหรับ Admin สร้างสินค้าใหม่ในคลัง
export async function createInventoryItem(input: CreateItemInput) {
  const [newItem] = await db
    .insert(inventoryItems)
    .values({
      name: input.name,
      quantity: input.quantity,
      // แปลง Date object เป็น string 'YYYY-MM-DD'
      lastRestockDate: new Date().toISOString().split("T")[0],
    })
    .returning();

  return newItem;
}

export async function updateInventoryItem(
  itemId: string,
  data: UpdateItemInput
) {
  // แก้ไข Type Hint ตรงนี้ให้เป็น string
  const updateData: { name?: string; quantity?: number; lastRestockDate?: string } = {};

  if (data.name) {
    updateData.name = data.name;
  }
  if (data.quantity !== undefined) {
    updateData.quantity = data.quantity;
    // แปลง Date object เป็น string 'YYYY-MM-DD'
    updateData.lastRestockDate = new Date().toISOString().split('T')[0];
  }

  if (Object.keys(updateData).length === 0) {
      return null;
  }

  const [updatedItem] = await db
    .update(inventoryItems)
    .set(updateData)
    .where(eq(inventoryItems.id, itemId))
    .returning();
  
  return updatedItem;
}


// Service สำหรับ Admin อัปเดตประเภทของสินค้า
export async function updateItemType(
  itemId: string,
  newType: UpdateItemTypeInput['type']
) {
  const [updatedItem] = await db
    .update(inventoryItems)
    .set({ type: newType as "consumable" | "reusable" })
    .where(eq(inventoryItems.id, itemId))
    .returning();

  return updatedItem;
}

// Service สำหรับ Admin ลบสินค้า
export async function deleteInventoryItem(itemId: string) {
  const [deletedItem] = await db
    .delete(inventoryItems)
    .where(eq(inventoryItems.id, itemId))
    .returning({ id: inventoryItems.id });
  return deletedItem;
}

export async function confirmReturn(requestId: string) {
  return db.transaction(async (tx) => {
    // 1. ค้นหาคำขอเพื่อดูว่าขออะไรไปเท่าไหร่
    const request = await tx.query.inventoryRequests.findFirst({
      where: and(
        eq(inventoryRequests.id, requestId),
        eq(inventoryRequests.status, 'pending_return')
      ),
    });

    if (!request) {
      throw new Error('Request not found or not pending return.');
    }

    // 2. บวกจำนวนสินค้าคืนกลับเข้าสต็อก
    await tx
      .update(inventoryItems)
      .set({
        quantity: sql`${inventoryItems.quantity} + ${request.quantity}`,
      })
      .where(eq(inventoryItems.id, request.itemId));

    // 3. อัปเดตสถานะของคำขอเป็น 'returned'
    const [returnedRequest] = await tx
      .update(inventoryRequests)
      .set({ status: 'returned' })
      .where(eq(inventoryRequests.id, requestId))
      .returning();
      
    return returnedRequest;
  });
}