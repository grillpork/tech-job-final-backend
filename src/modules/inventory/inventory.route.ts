import { FastifyInstance } from "fastify";
import { createAuthHook } from "../../hooks/authHook";
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
} from "./inventory.controller";
import {
  createItemRequestSchema,
  createRequestRequestSchema,
  deleteInventoryItem,
  manageRequestRequestSchema,
  updateItemRequestSchema,
  updateItemTypeRequestSchema,
} from "./inventory.schema";



// Hook สำหรับอนุญาตให้ user ทุกคน (ที่ login แล้ว) เข้าถึงได้
const allUsersHook = createAuthHook(["admin", "employee"]);
const adminOnlyHook = createAuthHook(["admin"]);

async function inventoryRoutes(server: FastifyInstance) {
  // Route สำหรับให้ Employee ดูรายการของที่มีในคลัง
  server.get("/items", { preHandler: [allUsersHook] }, getAllItemsHandler);

  // Route สำหรับให้ Employee สร้างคำขอเบิกใหม่
  server.post(
    "/requests",
    {
      preHandler: [allUsersHook],
      schema: createRequestRequestSchema,
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
  server.post(
    "/requests/:requestId/approve",
    {
      preHandler: [adminOnlyHook],
      schema: manageRequestRequestSchema,
    },
    approveRequestHandler
  );

  // Route สำหรับ Admin ปฏิเสธคำขอ
  server.post(
    "/requests/:requestId/reject",
    {
      preHandler: [adminOnlyHook],
      schema: manageRequestRequestSchema,
    },
    rejectRequestHandler
  );

  // Route สำหรับ Admin อัปเดตสต็อกสินค้าโดยตรง
  // แก้ไข Route นี้
  server.patch(
    "/items/:itemId",
    {
      preHandler: [adminOnlyHook],
      schema: updateItemRequestSchema,
    },
    updateItemHandler
  );

  // Route สำหรับ Admin สร้างสินค้าใหม่
  server.post(
    "/items",
    {
      preHandler: [adminOnlyHook],
      schema: createItemRequestSchema,
    },
    createItemHandler
  );

  server.patch( // <-- เช็คว่าเป็น 'patch'
    '/items/:itemId/type', // <-- เช็คว่า path ถูกต้อง
    {
      preHandler: [adminOnlyHook],
      schema: updateItemTypeRequestSchema
    },
    updateItemTypeHandler
  );

 server.delete(
        '/items/:itemId',
        {
            preHandler: [adminOnlyHook],
            schema: deleteInventoryItem // ใช้ schema เดิม
        },
        deleteItemHandler
    );

}

export default inventoryRoutes;
