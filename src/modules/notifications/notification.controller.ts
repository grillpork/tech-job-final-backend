import { FastifyRequest } from 'fastify';
import { getMyNotifications, markNotificationAsRead } from './notification.service.js';

export async function getMyNotificationsHandler(request: FastifyRequest) {
  return getMyNotifications(request.user.id);
}

export async function markAsReadHandler(request: FastifyRequest<{ Params: { notificationId: string } }>) {
  return markNotificationAsRead(request.params.notificationId, request.user.id);
}