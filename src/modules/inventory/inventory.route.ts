import { FastifyInstance } from "fastify";
import { createAuthHook } from "../../hooks/authHook.js";
import {
  getAllItemsHandler,
  createRequestHandler,
  getMyRequestsHandler,
  getAllRequestsHandler,
  approveRequestHandler,
  rejectRequestHandler,
  createItemHandler,
  updateItemHandler,
  updateItemTypeHandler,
  deleteItemHandler,
} from "./inventory.controller.js";
import {
  createItemRequestSchema,
  createRequestRequestSchema,
  deleteInventoryItem,
  manageRequestRequestSchema,
  updateItemRequestSchema,
  updateItemTypeRequestSchema,
} from "./inventory.schema.js";



// Hook สำหรับอนุญาตให้ user ทุกคน (ที่ login แล้ว) เข้าถึงได้
const allUsersHook = createAuthHook(["admin", "employee"]);
const adminOnlyHook = createAuthHook(["admin"]);

async function inventoryRoutes(server: FastifyInstance) {
  // Route สำหรับให้ Employee ดูรายการของที่มีในคลัง
  server.get("/items", { preHandler: [allUsersHook] }, getAllItemsHandler);

  // Route สำหรับให้ Employee สร้างคำขอเบิกใหม่
  server.post<{ Body: { quantity: number; itemId: string; jobId?: string; reason?: string } }>(
    "/requests",
    {
      preHandler: [allUsersHook],
      schema: createRequestRequestSchema as any,
    },
    createRequestHandler
  );

  // Route สำหรับให้ Employee ดูสถานะคำขอของตัวเอง
  server.get(
    "/requests/me",
    { preHandler: [allUsersHook] },
    getMyRequestsHandler
  );

  // --- Admin Routes ---

  // Route สำหรับ Admin ดูคำขอเบิกทั้งหมด
  server.get(
    "/requests",
    { preHandler: [adminOnlyHook] },
    getAllRequestsHandler
  );

  // Route สำหรับ Admin อนุมัติคำขอ
  server.post<{ Params: { requestId: string } }>(
    "/requests/:requestId/approve",
    {
      preHandler: [adminOnlyHook],
      schema: manageRequestRequestSchema as any,
    },
    approveRequestHandler
  );

  // Route สำหรับ Admin ปฏิเสธคำขอ
  server.post<{ Params: { requestId: string } }>(
    "/requests/:requestId/reject",
    {
      preHandler: [adminOnlyHook],
      schema: manageRequestRequestSchema as any,
    },
    rejectRequestHandler
  );

  // Route สำหรับ Admin อัปเดตสต็อกสินค้าโดยตรง
  // แก้ไข Route นี้
  server.patch<{ Params: { itemId: string }; Body: { name?: string; quantity?: number } }>(
    "/items/:itemId",
    {
      preHandler: [adminOnlyHook],
      schema: updateItemRequestSchema as any,
    },
    updateItemHandler
  );

  // Route สำหรับ Admin สร้างสินค้าใหม่
  server.post<{ Body: { name: string; quantity: number } }>(
    "/items",
    {
      preHandler: [adminOnlyHook],
      schema: createItemRequestSchema as any,
    },
    createItemHandler
  );

  server.patch<{ Params: { itemId: string }; Body: { type: "consumable" | "reusable" } }>( // <-- เช็คว่าเป็น 'patch'
    '/items/:itemId/type', // <-- เช็คว่า path ถูกต้อง
    {
      preHandler: [adminOnlyHook],
      schema: updateItemTypeRequestSchema as any, // <-- ใช้ schema ที่ถูกต้อง
    },
    updateItemTypeHandler
  );

 server.delete<{ Params: { itemId: string } }>(
        '/items/:itemId',
        {
            preHandler: [adminOnlyHook]
        },
        deleteItemHandler
    );

}

export default inventoryRoutes;
