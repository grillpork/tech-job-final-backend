import { db } from '../../db';
// เพิ่ม assignments เข้ามา
import { jobs, assignments, inventoryRequests, inventoryItems, jobHistory, timeLogs, jobComments, jobHistoryFiles, jobAttachments } from '../../db/schema'; 
import { eq, and, sql, notExists, isNull, desc } from 'drizzle-orm';
import { CreateJobInput, UpdateJobStatusInput, AssignJobInput, CreateJobHistoryInput, PaginationInput, UpdateJobInput,  } from './job.schema';


export async function createJob(input: CreateJobInput, createdBy: string) {
  return db.transaction(async (tx) => {
    const [newJob] = await tx.insert(jobs).values({
      title: input.title,
      description: input.description,
      createdBy: createdBy,
      date: new Date(),
    }).returning();

    if (input.attachments && input.attachments.length > 0) {
      const attachmentData = input.attachments.map(att => ({
        jobId: newJob.id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        uploadedBy: createdBy,
      }));
      await tx.insert(jobAttachments).values(attachmentData);
    }
    return newJob;
  });
}




// ✅ แก้ไขฟังก์ชันนี้
export async function getAllJobs(input: PaginationInput) {
  const { page, limit } = input;
  const offset = (page - 1) * limit;

  // 1. ดึงข้อมูล Job ตามหน้าและจำนวนที่กำหนด
  const jobData = await db.query.jobs.findMany({
    with: {
      creator: { columns: { name: true } },
      assignments: { with: { user: { columns: { name: true } } } },
    },
    limit: limit,
    offset: offset,
    orderBy: (job, { desc }) => [desc(job.createdAt)],
  });

  // 2. นับจำนวน Job ทั้งหมด (เพื่อใช้คำนวณจำนวนหน้าทั้งหมด)
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(jobs);
  const totalJobs = totalResult[0].count;

  return {
    data: jobData,
    meta: {
      total: totalJobs,
      page,
      limit,
      totalPages: Math.ceil(totalJobs / limit),
    },
  };
}

// Service สำหรับดึงงานชิ้นเดียวด้วย ID
export async function getJobById(jobId: string) {
  return db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
    with: {
      creator: { columns: { name: true } },
      assignments: {
        with: { user: { columns: { name: true } } },
      },
      comments: { // ดึงคอมเมนต์มาด้วย
        with: { user: { columns: { name: true, imageUrl: true } } },
        orderBy: (comment, { desc }) => [desc(comment.createdAt)],
      },
       timeLogs: { // ✅ เพิ่มการดึงข้อมูล timeLogs
        orderBy: (log, { desc }) => [desc(log.startTime)],
      },
    },
  });
}

export async function assignJobToUser(jobId: string, userId: string) {
  // ใช้ transaction เพื่อให้แน่ใจว่าถ้ามีอะไรผิดพลาดจะยกเลิกทั้งหมด
  return db.transaction(async (tx) => {
    // 1. สร้าง assignment record ใหม่
    const [newAssignment] = await tx
      .insert(assignments)
      .values({ jobId, userId })
      .returning();

    // 2. อัปเดตสถานะของ Job เป็น 'in_progress'
    await tx
      .update(jobs)
      .set({ status: 'in_progress' })
      .where(eq(jobs.id, jobId));
      
    return newAssignment;
  });
}

// Service สำหรับดึงงานที่มอบหมายให้พนักงานคนนั้นๆ
export async function getMyAssignedJobs(userId: string) {
  // เราจะ query จากตาราง assignments เพื่อหา job ที่ผูกกับ userId นี้
  const assigned = await db.query.assignments.findMany({
    where: eq(assignments.userId, userId),
    with: {
      job: { // ดึงข้อมูล job ที่เชื่อมกันมาด้วย
        with: {
          creator: { columns: { name: true } },
        }
      },
    },
    orderBy: (assignment, { desc }) => [desc(assignment.assignedAt)],
  });

  // จัดรูปแบบข้อมูลใหม่ให้ใช้ง่ายขึ้นใน Frontend
  return assigned.map(a => a.job);
}

// Service สำหรับอัปเดตสถานะงาน
export async function updateJobStatus(jobId: string, status: UpdateJobStatusInput['status']) {
  return db.transaction(async (tx) => {
    // 1. อัปเดตสถานะของ Job
    const [updatedJob] = await tx
      .update(jobs)
      .set({ status })
      .where(eq(jobs.id, jobId))
      .returning();

    // 2. ถ้าสถานะเป็น 'completed' ให้เริ่มกระบวนการคืนของ
    if (status === 'completed') {
      // 2.1 ค้นหาคำขอเบิกทั้งหมดที่เกี่ยวข้องกับงานนี้และถูกอนุมัติไปแล้ว
      const approvedRequests = await tx.query.inventoryRequests.findMany({
        where: and(
          eq(inventoryRequests.jobId, jobId),
          eq(inventoryRequests.status, 'approved')
        ),
        with: {
          item: true, // ดึงข้อมูล item มาด้วยเพื่อเช็ค type
        },
      });

      // 2.2 วนลูปเพื่อคืนของที่เป็น 'reusable' เท่านั้น
      for (const req of approvedRequests) {
        if (req.item.type === 'reusable') {
          await tx
            .update(inventoryItems)
            .set({
              quantity: sql`${inventoryItems.quantity} + ${req.quantity}`,
            })
            .where(eq(inventoryItems.id, req.itemId));
        }
        // (Optional) อาจจะอัปเดตสถานะ request เป็น 'returned'
      }
    }
    
    return updatedJob;
  });
}

// Service สำหรับจบงานและจัดการการคืนของ
export async function completeJobAndHandleReturns(
  jobId: string,
  returnedItems: { requestId: string; returnStatus: 'returned' | 'damaged' | 'lost'; returnNotes?: string }[]
) {
  return db.transaction(async (tx) => {
    // 1. อัปเดตสถานะงานเป็น 'completed'
    const [updatedJob] = await tx
      .update(jobs)
      .set({ status: 'completed' })
      .where(eq(jobs.id, jobId))
      .returning();

    // 2. วนลูปเพื่อจัดการของแต่ละชิ้นที่คืนมา
    for (const item of returnedItems) {
      // 2.1 ค้นหาข้อมูลคำขอเดิม
      const request = await tx.query.inventoryRequests.findFirst({
        where: eq(inventoryRequests.id, item.requestId),
      });
      if (!request) continue; // ข้ามไปถ้าไม่เจอ

      // 2.2 อัปเดตสถานะการคืนและหมายเหตุ
      await tx
        .update(inventoryRequests)
        .set({
          returnStatus: item.returnStatus,
          returnNotes: item.returnNotes,
        })
        .where(eq(inventoryRequests.id, item.requestId));
        
      // 2.3 คืนของเข้าสต็อกเฉพาะชิ้นที่สถานะเป็น 'returned'
      if (item.returnStatus === 'returned') {
        await tx
          .update(inventoryItems)
          .set({
            quantity: sql`${inventoryItems.quantity} + ${request.quantity}`,
          })
          .where(eq(inventoryItems.id, request.itemId));
      }
      // ถ้าเป็น 'damaged' หรือ 'lost' เราจะไม่คืนของเข้าสต็อก
      // และ (Optional) สร้าง notification แจ้งเตือน Admin
    }

    return updatedJob;
  });
}



export async function createJobHistoryEntry(
  jobId: string,
  employeeId: string,
  input: CreateJobHistoryInput
) {
  return db.transaction(async (tx) => {
    const [historyEntry] = await tx.insert(jobHistory).values({
      jobId,
      employeeId,
      description: input.description,
    }).returning();

    if (input.files && input.files.length > 0) {
        const fileData = input.files.map(file => ({
            historyId: historyEntry.id,
            fileUrl: file.fileUrl,
            fileType: file.fileType || 'image',
        }));
        await tx.insert(jobHistoryFiles).values(fileData);
    }

    await tx.update(jobs).set({ status: 'completed' }).where(eq(jobs.id, jobId));
    return historyEntry;
  });
}

// Service สำหรับแก้ไขงาน
export async function updateJob(jobId: string, data: UpdateJobInput) {
  const [updatedJob] = await db
    .update(jobs)
    .set(data)
    .where(eq(jobs.id, jobId))
    .returning();
  return updatedJob;
}

// Service สำหรับลบงาน
export async function deleteJob(jobId: string) {
  const [deletedJob] = await db
    .delete(jobs)
    .where(eq(jobs.id, jobId))
    .returning({ id: jobs.id }); // คืนค่า ID ที่ถูกลบ
  return deletedJob;
}

// Service สำหรับดึงงานที่ยังไม่มีการมอบหมาย
export async function getUnassignedJobs() {
  return db.query.jobs.findMany({
    // เงื่อนไข: ค้นหา jobs ที่ id ของมัน "ไม่มี" อยู่ในคอลัมน์ jobId ของตาราง assignments
    where: notExists(
      db.select().from(assignments).where(eq(assignments.jobId, jobs.id))
    ),
    with: {
      creator: { columns: { name: true } },
    },
    orderBy: (job, { desc }) => [desc(job.createdAt)],
  });
}

export async function startTimeLog(jobId: string, userId: string) {
  // เช็คว่ามี log ที่ยังไม่ปิดหรือไม่
  const existingLog = await db.query.timeLogs.findFirst({
    where: and(
      eq(timeLogs.jobId, jobId),
      eq(timeLogs.userId, userId),
      isNull(timeLogs.endTime)
    )
  });
  if (existingLog) throw new Error("Timer is already running for this job.");

  const [newLog] = await db.insert(timeLogs).values({
    jobId,
    userId,
    startTime: new Date(),
  }).returning();
  return newLog;
}

// Service สำหรับหยุดจับเวลา
export async function stopTimeLog(jobId: string, userId: string) {
  // หา Log ล่าสุดที่ยังไม่ถูกปิด
  const logToStop = await db.query.timeLogs.findFirst({
    where: and(
      eq(timeLogs.jobId, jobId),
      eq(timeLogs.userId, userId),
      isNull(timeLogs.endTime)
    ),
    orderBy: [desc(timeLogs.startTime)]
  });

  if (!logToStop) throw new Error("No active timer to stop.");

  const endTime = new Date();
  const durationMinutes = Math.round((endTime.getTime() - logToStop.startTime.getTime()) / 60000);

  const [stoppedLog] = await db.update(timeLogs).set({
    endTime: endTime,
    durationMinutes: durationMinutes,
  }).where(eq(timeLogs.id, logToStop.id)).returning();
  
  return stoppedLog;
}

export async function createComment(jobId: string, userId: string, comment: string) {
  const [newComment] = await db.insert(jobComments).values({
    jobId,
    userId,
    comment,
  }).returning();
  return newComment;
}
