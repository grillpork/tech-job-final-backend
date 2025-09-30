import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../utils/supabase';
import { randomUUID } from 'crypto';

export async function uploadImageHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const file = await request.file();
    if (!file) {
      return reply.badRequest('No file uploaded.');
    }

    // สร้างชื่อไฟล์ใหม่ที่ไม่ซ้ำกัน เพื่อป้องกันการเขียนทับ
    const fileExtension = file.filename.split('.').pop();
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const user = request.user as { id: string }; // Explicitly cast request.user to include id
    const filePath = `${user.id}/${uniqueFileName}`; // จัดเก็บในโฟลเดอร์ตาม user id

    // Upload file to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('job_files') // ชื่อ bucket ของคุณ
      .upload(filePath, await file.toBuffer(), {
        contentType: file.mimetype,
        upsert: false, // ไม่ให้เขียนทับไฟล์ที่มีชื่อเดียวกัน
      });

    if (error) {
      throw error;
    }

    // ดึง Public URL ของไฟล์ที่เพิ่งอัปโหลด
    const { data: urlData } = supabaseAdmin.storage
      .from('job_files')
      .getPublicUrl(data.path);

    // ส่ง URL กลับไปให้ Frontend เพื่อนำไปบันทึกลง database ต่อไป
    return reply.send({ publicUrl: urlData.publicUrl });

  } catch (err: any) {
    console.error('Upload error:', err);
    return reply.internalServerError('Failed to upload file.');
  }
}