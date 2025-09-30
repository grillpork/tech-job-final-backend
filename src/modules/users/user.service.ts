import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { UpdateUserInput } from './user.schema';

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ด้วย ID
export async function findUserById(id: string) {
  // ใช้ Drizzle query เพื่อหา user
  // เราเลือกที่จะไม่ส่ง passwordHash กลับไปเพื่อความปลอดภัย
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      imageUrl: true,
      createdAt: true,
    },
    with: {
      position: {
        columns: {
          name: true,
        },
      },
    },
  });
  return user;
}

// Service สำหรับอัปเดต URL รูปโปรไฟล์
export async function updateUserAvatar(userId: string, imageUrl: string) {
  const [updatedUser] = await db
    .update(users)
    .set({ imageUrl: imageUrl })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      imageUrl: users.imageUrl, // ส่งค่าที่อัปเดตแล้วกลับไป
    });

  return updatedUser;
}

export async function getAllUsers() {
  return db.query.users.findMany({
    // ไม่ดึง passwordHash กลับไปเพื่อความปลอดภัย
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      imageUrl: true,
      positionId: true,
    },
    with: {
      position: {
        // ดึงข้อมูลตำแหน่งมาด้วย
        columns: {
          name: true,
        },
      },
    },
  });
}

// Service สำหรับ Admin แก้ไขข้อมูล User
export async function updateUser(userId: string, data: UpdateUserInput) {
  const [updatedUser] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning();

  return updatedUser;
}

export async function updateUserStatus(
  userId: string,
  status: 'available' | 'busy' | 'on_leave' | 'resigned'
) {
  const [updatedUser] = await db
    .update(users)
    .set({ status: status })
    .where(eq(users.id, userId))
    .returning({ id: users.id, status: users.status });

  return updatedUser;
}