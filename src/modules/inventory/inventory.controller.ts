import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateItemInput,
  CreateRequestInput,
  UpdateItemInput,
  UpdateItemQuantityInput,
  UpdateItemTypeInput,
} from './inventory.schema.js';
import {
  getAllInventoryItems,
  createInventoryRequest,
  getMyRequests,
  approveRequest,
  getAllPendingRequests,
  rejectRequest,
  updateItemQuantity,
  createInventoryItem,
  updateInventoryItem,
  updateItemType,
  deleteInventoryItem,
} from './inventory.service.js';

// Handler สำหรับดึงรายการสินค้าทั้งหมด
export async function getAllItemsHandler() {
  const items = await getAllInventoryItems();
  return items;
}

// Handler สำหรับสร้างคำขอเบิก (เวอร์ชันปรับปรุง)
export async function createRequestHandler(
  request: FastifyRequest<{ Body: CreateRequestInput }>,
  reply: FastifyReply
) {
  const user = request.user as { id: string }; // Explicitly cast request.user to include id

  try {
    const newRequest = await createInventoryRequest(
      request.body,
      user.id
    );
    return reply.code(201).send(newRequest);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === 'Insufficient stock available.'
    ) {
      return reply.badRequest(error.message);
    }
    return reply.internalServerError('Could not process the request.');
  }
}

// Handler สำหรับดูประวัติการเบิกของตัวเอง
export async function getMyRequestsHandler(request: FastifyRequest) {
  const user = request.user as { id: string }; // Explicitly cast request.user to include id
  const requests = await getMyRequests(user.id);
  return requests;
}

// --- HANDLERS FOR ADMIN ---

export async function getAllRequestsHandler() {
  const requests = await getAllPendingRequests();
  return requests;
}

export async function approveRequestHandler(
  request: FastifyRequest<{ Params: { requestId: string } }>,
  reply: FastifyReply
) {
  const approvedRequest = await approveRequest(request.params.requestId);
  return approvedRequest;
}

export async function rejectRequestHandler(
  request: FastifyRequest<{ Params: { requestId: string } }>,
  reply: FastifyReply
) {
  try {
    const rejectedRequest = await rejectRequest(request.params.requestId);
    return rejectedRequest;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return reply.badRequest(error.message);
    }
    return reply.internalServerError('An unexpected error occurred');
  }
}

// Handler สำหรับ Admin อัปเดตจำนวนสินค้า
export async function updateItemQuantityHandler(
  request: FastifyRequest<{
    Params: { itemId: string };
    Body: UpdateItemQuantityInput;
  }>,
  reply: FastifyReply
) {
  const { itemId } = request.params;
  const { quantity } = request.body;

  const updatedItem = await updateItemQuantity(itemId, quantity);

  if (!updatedItem) {
    return reply.notFound('Inventory item not found');
  }

  return updatedItem;
}

// Handler สำหรับ Admin สร้างสินค้าใหม่
export async function createItemHandler(
  request: FastifyRequest<{ Body: CreateItemInput }>,
  reply: FastifyReply
) {
  const newItem = await createInventoryItem(request.body);
  return reply.code(201).send(newItem);
}

export async function updateItemHandler(
  // highlight-end
  request: FastifyRequest<{
    Params: { itemId: string };
    Body: UpdateItemInput;
  }>,
  reply: FastifyReply
) {
  const { itemId } = request.params;

  const updatedItem = await updateInventoryItem(itemId, request.body);

  if (!updatedItem) {
    return reply.notFound(
      'Inventory item not found or no data provided for update'
    );
  }

  return updatedItem;
}

// Handler สำหรับ Admin อัปเดตประเภทของสินค้า
export async function updateItemTypeHandler(
  request: FastifyRequest<{
    Params: { itemId: string };
    Body: UpdateItemTypeInput;
  }>,
  reply: FastifyReply
) {
  const { itemId } = request.params;
  const { type } = request.body;

  const updatedItem = await updateItemType(itemId, type);

  if (!updatedItem) {
    return reply.notFound('Inventory item not found');
  }

  return updatedItem;
}

// Handler สำหรับ Admin ลบสินค้า
export async function deleteItemHandler(
    request: FastifyRequest<{ Params: { itemId: string } }>,
    reply: FastifyReply
) {
    const deletedItem = await deleteInventoryItem(request.params.itemId);
    if (!deletedItem) {
        return reply.notFound('Inventory item not found');
    }
    return reply.code(204).send();
}
