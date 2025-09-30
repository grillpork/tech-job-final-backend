import { db } from '../../db';
import { notifications } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getMyNotifications(userId: string) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit: 50, // จำกัดจำนวนเพื่อ performance
  });
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId) // เช็คว่าเป็นเจ้าของ notification จริง
    ))
    .returning();
  return updated;
}