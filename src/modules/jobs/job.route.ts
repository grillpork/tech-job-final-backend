import { FastifyInstance } from 'fastify';
import { createAuthHook } from '../../hooks/authHook.js';
import {
  assignJobHandler,
  completeJobHandler,
  createCommentHandler,
  createJobHandler,
  createJobHistoryHandler,
  deleteJobHandler,
  getAllJobsHandler,
  getJobByIdHandler,
  getMyJobsHandler,
  getUnassignedJobsHandler,
  startTimeLogHandler,
  stopTimeLogHandler,
  updateJobHandler,
  updateJobStatusHandler,
} from './job.controller.js';
import {
  assignJobRequestSchema,
  completeJobRequestSchema,
  createCommentRequestSchema,
  createJobHistoryRequestSchema,
  createJobRequestSchema,
  getJobRequestSchema,
  getJobsRequestSchema,
  updateJobRequestSchema,
  updateJobStatusRequestSchema,
} from './job.schema.js';

// สร้าง Hooks สำหรับ Role ที่ต้องการ
const adminOnlyHook = createAuthHook(['admin']);
const allUsersHook = createAuthHook(['admin', 'employee']);

async function jobRoutes(server: FastifyInstance) {
  // --- Collection Level Routes ---

  // GET /api/jobs (Get all jobs with pagination)
  server.get<{ Querystring: { page: number; limit: number } }>(
    '/',
    {
      preHandler: [allUsersHook],
      schema: getJobsRequestSchema as any,
    },
    getAllJobsHandler
  );

  // POST /api/jobs (Create a new job - Admin only)
  server.post<{
    Body: {
      title: string;
      description?: string;
      department?: string;
      attachments?: { fileName: string; fileUrl: string }[];
    };
  }>(
    '/',
    {
      preHandler: [adminOnlyHook],
      schema: createJobRequestSchema as any,
    },
    createJobHandler
  );

  // GET /api/jobs/me (Get jobs assigned to the current user)
  server.get(
    '/me',
    {
      preHandler: [allUsersHook],
    },
    getMyJobsHandler
  );
  
  // GET /api/jobs/unassigned (Get unassigned jobs)
  server.get(
    '/unassigned',
    {
      preHandler: [allUsersHook]
    },
    getUnassignedJobsHandler
  );

  // --- Item Level Routes (require a :jobId) ---
  
  // GET /api/jobs/:jobId (Get a single job by ID)
  server.get<{ Params: { jobId: string } }>(
    '/:jobId',
    {
      preHandler: [allUsersHook],
      schema: getJobRequestSchema as any,
    },
    getJobByIdHandler
  );

  // PATCH /api/jobs/:jobId (Update a job - Admin only)
  server.patch<{
    Params: { jobId: string };
    Body: {
      status?: 'in_progress' | 'pending' | 'completed' | 'cancelled';
      title?: string;
      description?: string;
      locationName?: string;
      department?: string;
      lat?: number;
      lng?: number;
    };
  }>(
    '/:jobId',
    {
      preHandler: [adminOnlyHook],
      schema: updateJobRequestSchema as any,
    },
    updateJobHandler
  );

  // DELETE /api/jobs/:jobId (Delete a job - Admin only)
  server.delete<{ Params: { jobId: string } }>(
    '/:jobId',
    {
      preHandler: [adminOnlyHook],
      schema: getJobRequestSchema as any,
    },
    deleteJobHandler
  );

  // POST /api/jobs/:jobId/assign (Assign a job to a user - Admin only)
  server.post<{ Params: { jobId: string }; Body: { userId: string } }>(
    '/:jobId/assign',
    {
      preHandler: [allUsersHook],
      schema: assignJobRequestSchema as any,
    },
    assignJobHandler
  );

  // PATCH /api/jobs/:jobId/status (Update a job's status)
  server.patch<{
    Params: { jobId: string };
    Body: { status: 'in_progress' | 'pending' | 'completed' | 'cancelled' };
  }>(
    '/:jobId/status',
    {
      preHandler: [allUsersHook],
      schema: updateJobStatusRequestSchema as any,
    },
    updateJobStatusHandler
  );

  // POST /api/jobs/:jobId/complete (Complete a job and handle returns)
  server.post<{ Params: { jobId: string }; Body: { returnedItems: any[] } }>(
    '/:jobId/complete',
    {
      preHandler: [allUsersHook],
      schema: completeJobRequestSchema as any,
    },
    completeJobHandler
  );

  // POST /api/jobs/:jobId/history (Submit a job history report)
  server.post<{
    Params: { jobId: string };
    Body: { description: string; files?: { fileUrl: string; fileType?: string }[] };
  }>(
    '/:jobId/history',
    {
      preHandler: [allUsersHook],
      schema: createJobHistoryRequestSchema as any,
    },
    createJobHistoryHandler
  );

  server.post<{ Params: { jobId: string } }>(
        '/:jobId/timelog/start',
        { preHandler: [allUsersHook] },
        startTimeLogHandler
    );

    server.post<{ Params: { jobId: string } }>(
        '/:jobId/timelog/stop',
        { preHandler: [allUsersHook] },
        stopTimeLogHandler
    );

     server.post<{ Params: { jobId: string }; Body: { comment: string } }>(
        '/:jobId/comments',
        {
            preHandler: [allUsersHook],
            schema: createCommentRequestSchema as any
        },
        createCommentHandler
    );
}

export default jobRoutes;