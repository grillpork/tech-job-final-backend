import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { AssignJobInput, CreateJobHistoryInput, CreateJobInput, JobParamsInput, PaginationInput, UpdateJobInput, UpdateJobStatusInput } from "./job.schema";
import {
  createJob,
  getAllJobs,
  getJobById,
  assignJobToUser,
  updateJobStatus,
  completeJobAndHandleReturns,
  createJobHistoryEntry,
  getMyAssignedJobs,
  updateJob, 
  deleteJob,
  getUnassignedJobs,
  startTimeLog,
  stopTimeLog,
  createComment
} from "./job.service";

// Augment request type for authenticated handlers that expect request.user
type AuthenticatedRequest<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & { user: { id: string } };

// Handler สำหรับสร้างงาน
export async function createJobHandler(
  request: AuthenticatedRequest<{ Body: CreateJobInput }>,
  reply: FastifyReply
) {
  // request.user.id มาจาก authHook
  const job = await createJob(request.body, request.user.id);
  return reply.code(201).send(job);
}

// Handler สำหรับดึงงานทั้งหมด
export async function getAllJobsHandler(
  request: FastifyRequest<{ Querystring: PaginationInput }>
) {
  const jobs = await getAllJobs(request.query);
  return jobs;
}

// Handler สำหรับดึงงานชิ้นเดียว
export async function getJobByIdHandler(
  request: FastifyRequest<{ Params: JobParamsInput }>,
  reply: FastifyReply
) {
  const job = await getJobById(request.params.jobId);
  if (!job) {
    return reply.notFound("Job not found");
  }
  return job;
}


// Handler สำหรับมอบหมายงาน
export async function assignJobHandler(
  request: FastifyRequest<{ Params: JobParamsInput; Body: AssignJobInput }>,
  reply: FastifyReply
) {
  const { jobId } = request.params;
  const { userId } = request.body;

  // Authorization check: อาจเพิ่มเงื่อนไขว่ามอบหมายให้ employee เท่านั้น
  const assignment = await assignJobToUser(jobId, userId);
  return reply.code(201).send(assignment);
}

// Handler สำหรับอัปเดตสถานะ
export async function updateJobStatusHandler(
  request: FastifyRequest<{ Params: JobParamsInput; Body: UpdateJobStatusInput }>,
  reply: FastifyReply
) {
  // Authorization check: ควรเช็คว่าผู้ที่ส่ง request เป็น admin หรือเป็นเจ้าของงาน
  // ในที่นี้เราจะอนุญาตให้ทุกคนที่ล็อกอินอัปเดตได้ก่อน แล้วค่อยเพิ่ม logic ทีหลัง
  const { jobId } = request.params;
  const { status } = request.body;
  
  const updatedJob = await updateJobStatus(jobId, status);
  return updatedJob;
}

// Handler สำหรับจบงาน
export async function completeJobHandler(
  request: FastifyRequest<{ Params: JobParamsInput; Body: { returnedItems: any[] } }>,
  reply: FastifyReply
) {
  const { jobId } = request.params;
  const { returnedItems } = request.body;
  const job = await completeJobAndHandleReturns(jobId, returnedItems);
  return job;
}


export async function createJobHistoryHandler(
  request: AuthenticatedRequest<{ Params: JobParamsInput; Body: CreateJobHistoryInput }>,
  reply: FastifyReply
) {
  const { jobId } = request.params;
  const employeeId = request.user.id; // ID ของพนักงานที่ล็อกอินอยู่

  // (Optional) อาจเพิ่ม Logic ตรวจสอบว่าพนักงานคนนี้เป็นผู้รับผิดชอบงานนี้จริงหรือไม่

  const history = await createJobHistoryEntry(jobId, employeeId, request.body);
  return reply.code(201).send(history);
}

// Handler สำหรับดึงงานของตัวเอง
export async function getMyJobsHandler(request: AuthenticatedRequest) {
  const jobs = await getMyAssignedJobs(request.user.id);
  return jobs;
}

// Handler สำหรับแก้ไขงาน
export async function updateJobHandler(
  request: FastifyRequest<{ Params: JobParamsInput; Body: UpdateJobInput }>,
  reply: FastifyReply
) {
  const job = await updateJob(request.params.jobId, request.body);
  if (!job) return reply.notFound('Job not found');
  return job;
}

// Handler สำหรับลบงาน
export async function deleteJobHandler(
  request: FastifyRequest<{ Params: JobParamsInput }>,
  reply: FastifyReply
) {
  const job = await deleteJob(request.params.jobId);
  if (!job) return reply.notFound('Job not found');
  return reply.code(204).send(); // 204 No Content หมายถึงสำเร็จแต่ไม่มีข้อมูลส่งกลับ
}

// Handler สำหรับดึงงานที่ยังว่าง
export async function getUnassignedJobsHandler() {
  const jobs = await getUnassignedJobs();
  return jobs;
}



export async function startTimeLogHandler(
  request: AuthenticatedRequest<{ Params: { jobId: string } }>,
  reply: FastifyReply
) {
  try {
    const log = await startTimeLog(request.params.jobId, request.user.id);
    return reply.code(201).send(log);
  } catch(e: any) {
    return reply.badRequest(e.message);
  }
}

export async function stopTimeLogHandler(
  request: AuthenticatedRequest<{ Params: { jobId: string } }>,
  reply: FastifyReply
) {
  try {
    const log = await stopTimeLog(request.params.jobId, request.user.id);
    return log;
  } catch (e: any) {
    return reply.badRequest(e.message);
  }
}


// ✅ เพิ่ม Handler นี้
export async function createCommentHandler(
  request: AuthenticatedRequest<{ Params: { jobId: string }, Body: { comment: string } }>,
  reply: FastifyReply
) {
  const comment = await createComment(
    request.params.jobId,
    request.user.id,
    request.body.comment
  );
  return reply.code(201).send(comment);
}

