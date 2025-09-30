import { FastifyInstance } from 'fastify';
import { createAuthHook } from '../../hooks/authHook';
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
} from './job.controller';
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
} from './job.schema';

// สร้าง Hooks สำหรับ Role ที่ต้องการ
const adminOnlyHook = createAuthHook(['admin']);
const allUsersHook = createAuthHook(['admin', 'employee']);

async function jobRoutes(server: FastifyInstance) {
  // --- Collection Level Routes ---

  // GET /api/jobs (Get all jobs with pagination)
  server.get(
    '/',
    {
      preHandler: [allUsersHook],
      schema: getJobsRequestSchema,
    },
    getAllJobsHandler
  );

  // POST /api/jobs (Create a new job - Admin only)
  server.post(
    '/',
    {
      preHandler: [adminOnlyHook],
      schema: createJobRequestSchema,
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
  server.get(
    '/:jobId',
    {
      preHandler: [allUsersHook],
      schema: getJobRequestSchema,
    },
    getJobByIdHandler
  );

  // PATCH /api/jobs/:jobId (Update a job - Admin only)
  server.patch(
    '/:jobId',
    {
      preHandler: [adminOnlyHook],
      schema: updateJobRequestSchema,
    },
    updateJobHandler
  );

  // DELETE /api/jobs/:jobId (Delete a job - Admin only)
  server.delete(
    '/:jobId',
    {
      preHandler: [adminOnlyHook],
      schema: getJobRequestSchema,
    },
    deleteJobHandler
  );

  // POST /api/jobs/:jobId/assign (Assign a job to a user - Admin only)
  server.post(
    '/:jobId/assign',
    {
      preHandler: [allUsersHook],
      schema: assignJobRequestSchema,
    },
    assignJobHandler
  );

  // PATCH /api/jobs/:jobId/status (Update a job's status)
  server.patch(
    '/:jobId/status',
    {
      preHandler: [allUsersHook],
      schema: updateJobStatusRequestSchema,
    },
    updateJobStatusHandler
  );

  // POST /api/jobs/:jobId/complete (Complete a job and handle returns)
  server.post(
    '/:jobId/complete',
    {
      preHandler: [allUsersHook],
      schema: completeJobRequestSchema,
    },
    completeJobHandler
  );

  // POST /api/jobs/:jobId/history (Submit a job history report)
  server.post(
    '/:jobId/history',
    {
      preHandler: [allUsersHook],
      schema: createJobHistoryRequestSchema,
    },
    createJobHistoryHandler
  );

  server.post(
        '/:jobId/timelog/start',
        { preHandler: [allUsersHook] },
        startTimeLogHandler
    );

    server.post(
        '/:jobId/timelog/stop',
        { preHandler: [allUsersHook] },
        stopTimeLogHandler
    );

     server.post(
        '/:jobId/comments',
        {
            preHandler: [allUsersHook],
            schema: createCommentRequestSchema
        },
        createCommentHandler
    );
}

export default jobRoutes;