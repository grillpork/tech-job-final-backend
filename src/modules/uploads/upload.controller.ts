import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../utils/supabase';
import { randomUUID } from 'crypto';

export async function uploadImageHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    // ใช้ as any เพื่อแก้ปัญหา Type ชั่วคราว
    const file = await (request as any).file();
    if (!file) {
      return reply.badRequest('No file uploaded.');
    }

    const fileExtension = file.filename.split('.').pop();
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const filePath = `${request.user.id}/${uniqueFileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('job_files')
      .upload(filePath, await file.toBuffer(), {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('job_files')
      .getPublicUrl(data.path);

    return reply.send({ publicUrl: urlData.publicUrl });

  } catch (err) {
    console.error('Upload error:', err);
    return reply.internalServerError('Failed to upload file.');
  }
}