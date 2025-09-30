import { roleEnum, userStatusEnum } from '@/db/schema';
import { z } from 'zod';

const updateUserAvatarSchema = z.object({
  imageUrl: z.string().url({ message: 'Invalid URL format' }),
});

export const updateUserAvatarRequestSchema = z.object({
  body: updateUserAvatarSchema,
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(roleEnum.enumValues).optional(),
  positionId: z.string().uuid().optional(),
});

const userParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const updateUserRequestSchema = z.object({
  body: updateUserSchema,
  params: userParamsSchema,
});

const updateUserStatusSchema = z.object({
  status: z.enum(userStatusEnum.enumValues),
});

export const updateUserStatusRequestSchema = z.object({
  body: updateUserStatusSchema,
  params: userParamsSchema, 
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserAvatarInput = z.infer<typeof updateUserAvatarSchema>;
