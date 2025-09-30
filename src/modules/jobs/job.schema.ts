import { z } from 'zod';
import { itemTypeEnum, jobStatusEnum, returnStatusEnum } from '../../db/schema.js';
const createJobSchema = z.object({
  title: z.string({ required_error: 'Title is required' }).min(3),
  description: z.string().optional(),
  department: z.string().optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string().url(),
      })
    )
    .optional(),
});
// const updateJobSchema = createJobSchema.partial();
const updateJobSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  department: z.string().optional(),
  locationName: z.string().optional(),
  status: z.enum(jobStatusEnum.enumValues).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
const jobParamsSchema = z.object({
  jobId: z.string().uuid(),
});

export const createJobRequestSchema = z.object({
  body: createJobSchema,
});

export const getJobRequestSchema = z.object({
  params: jobParamsSchema,
});

const assignJobSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

const updateJobStatusSchema = z.object({
  status: z.enum(jobStatusEnum.enumValues),
});

export const assignJobRequestSchema = z.object({
  body: assignJobSchema,
  params: jobParamsSchema, // ใช้ params schema เดิม
});

export const updateJobStatusRequestSchema = z.object({
  body: updateJobStatusSchema,
  params: jobParamsSchema,
});

const returnedItemSchema = z.object({
  requestId: z.string().uuid(),
  returnStatus: z.enum(returnStatusEnum.enumValues),
  returnNotes: z.string().optional(),
});

export const completeJobRequestSchema = z.object({
  params: jobParamsSchema,
  body: z.object({
    returnedItems: z.array(returnedItemSchema),
  }),
});

const createJobHistorySchema = z.object({
  description: z.string().min(10, 'Please provide a detailed description.'),
  files: z
    .array(
      z.object({
        fileUrl: z.string().url(),
        fileType: z.string().optional(),
      })
    )
    .optional(),
});

export const createJobHistoryRequestSchema = z.object({
  body: createJobHistorySchema,
  params: jobParamsSchema, // ใช้ params schema เดิม
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const getJobsRequestSchema = z.object({
  query: paginationQuerySchema,
});

export const updateJobRequestSchema = z.object({
  body: updateJobSchema,
  params: jobParamsSchema,
});

const createCommentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty.'),
});

export const createCommentRequestSchema = z.object({
  body: createCommentSchema,
  params: jobParamsSchema,
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export type PaginationInput = z.infer<typeof paginationQuerySchema>;
export type CreateJobHistoryInput = z.infer<typeof createJobHistorySchema>;
export type AssignJobInput = z.infer<typeof assignJobSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type JobParamsInput = z.infer<typeof jobParamsSchema>;
export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;
