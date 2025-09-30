import { FastifyRequest, FastifyReply } from 'fastify';
import { findUserById, getAllUsers, updateUser, updateUserAvatar, updateUserStatus } from './user.service';
import { UpdateUserAvatarInput, UpdateUserInput } from './user.schema';
import { supabaseAdmin } from '../../utils/supabase';

export async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
  // `request.user` จะถูกแนบเข้ามาโดย authHook ของเรา
  const user = await findUserById(request.user.id);

  if (!user) {
    return reply.notFound('User not found');
  }

  return reply.send(user);
}

// Handler สำหรับ Admin ดึงผู้ใช้ทั้งหมด
export async function getAllUsersHandler() {
  const allUsers = await getAllUsers();
  return allUsers;
}

// Handler สำหรับอัปเดต URL รูปโปรไฟล์
export async function updateAvatarHandler(
  request: FastifyRequest, // ไม่ต้องระบุ Type ของ Body แล้ว
  reply: FastifyReply
) {
  const userId = request.user.id;
  
  // 1. รับไฟล์จาก Request
  const file = await (request as any).file?.();
  if (!file) {
    return reply.badRequest('No avatar file uploaded.');
  }

  // (Optional) ตรวจสอบ Mimetype
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return reply.badRequest('Invalid file type. Only JPG, PNG, WEBP are allowed.');
  }

  try {
    // 2. อัปโหลดไฟล์ไปที่ Supabase Storage
    const fileExtension = file.filename.split('.').pop();
    const filePath = `${userId}/avatar.${fileExtension}`; // ตั้งชื่อไฟล์ avatar.ext ไปเลยเพื่อให้มีแค่ไฟล์เดียว

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars') // ใช้ bucket 'avatars' ที่เราสร้างไว้
      .upload(filePath, await file.toBuffer(), {
        contentType: file.mimetype,
        upsert: true, // ตั้งเป็น true เพื่อให้เขียนทับรูปโปรไฟล์เดิมได้
      });

    if (uploadError) {
      throw uploadError;
    }

    // 3. ดึง Public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);
      
    // แก้ปัญหา Cache ของ Supabase โดยการเพิ่ม timestamp เข้าไปใน URL
    const imageUrlWithTimestamp = `${urlData.publicUrl}?t=${new Date().getTime()}`;

    // 4. บันทึก URL ลงฐานข้อมูล (เรียกใช้ service เดิม)
    await updateUserAvatar(userId, imageUrlWithTimestamp);
    
    // 5. ส่งข้อมูล user ที่อัปเดตแล้วกลับไป
    const updatedUser = await findUserById(userId);
    return updatedUser;

  } catch (err: any) {
    console.error('Avatar upload error:', err);
    return reply.internalServerError('Failed to update avatar.');
  }
}


// Handler สำหรับ Admin แก้ไขข้อมูล User
export async function updateUserHandler(
  request: FastifyRequest<{ Params: { userId: string }; Body: UpdateUserInput }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  const updatedUser = await updateUser(userId, request.body);
  if (!updatedUser) {
    return reply.notFound('User not found');
  }
  return updatedUser;
}

// ✅ เพิ่ม Handler นี้
export async function updateUserStatusHandler(
  request: FastifyRequest<{ Params: { userId: string }; Body: { status: 'available' | 'busy' | 'on_leave' | 'resigned' } }>,
  reply: FastifyReply
) {
  const user = await updateUserStatus(request.params.userId, request.body.status);
  if (!user) {
    return reply.notFound('User not found');
  }
  return user;
}