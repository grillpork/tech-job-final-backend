import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  doublePrecision,
  boolean,
  pgEnum,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =================== ENUMS ===================
export const roleEnum = pgEnum("role", ["admin", "employee"]);
export const itemTypeEnum = pgEnum("item_type", ["consumable", "reusable"]);
export const returnStatusEnum = pgEnum("return_status", [
  "returned",
  "damaged",
  "lost",
]);

// ✅ 1. เพิ่ม Enums ใหม่สำหรับระบบแจ้งปัญหา
export const ticketCategoryEnum = pgEnum("ticket_category", ["equipment_failure", "it_support", "safety_concern", "other"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected", "pending_return", "returned"]);
// ✅ 1. เพิ่ม Enum ใหม่สำหรับสถานะผู้ใช้
export const userStatusEnum = pgEnum("user_status", ["available", "busy", "on_leave", "resigned"]);

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);


// =================== CORE TABLES ===================
// ✅ 2. เพิ่มตารางใหม่สำหรับเก็บ Tickets
export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: ticketCategoryEnum("category").notNull(),
  priority: ticketPriorityEnum("priority").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  reportedById: uuid("reported_by_id").references(() => users.id).notNull(),
  assignedToId: uuid("assigned_to_id").references(() => users.id), // Admin ที่รับผิดชอบ
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const positions = pgTable("positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  imageUrl: text("image_url"), // User profile image URL
  status: userStatusEnum("status").notNull().default("available"),
  role: roleEnum("role").notNull(),
  positionId: uuid("position_id").references(() => positions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  locationName: text("location_name"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  department: varchar("department", { length: 100 }),
  createdBy: uuid("created_by").references(() => users.id),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  status: jobStatusEnum("status").notNull().default("pending"),
  isRecurring: boolean("is_recurring").default(false),
  recurrenceRule: text("recurrence_rule"),
  nextOccurrenceDate: date("next_occurrence_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignments = pgTable("assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  jobId: uuid("job_id")
    .references(() => jobs.id)
    .notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const jobHistory = pgTable("job_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id")
    .references(() => jobs.id)
    .notNull(),
  employeeId: uuid("employee_id")
    .references(() => users.id)
    .notNull(),
  description: text("description"),
  completedAt: timestamp("completed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const jobComments = pgTable("job_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id")
    .references(() => jobs.id)
    .notNull(), // Linked directly to job
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== FEATURE-SPECIFIC TABLES ===================

// Inventory Management
export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  quantity: integer("quantity").notNull().default(0),
  type: itemTypeEnum("type").notNull().default("consumable"),
  lastRestockDate: date("last_restock_date"),
});

export const inventoryRequests = pgTable("inventory_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  requesterId: uuid("requester_id")
    .references(() => users.id)
    .notNull(),
  itemId: uuid("item_id")
    .references(() => inventoryItems.id)
    .notNull(),
  jobId: uuid("job_id").references(() => jobs.id), // Optional: link request to a job
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  status: requestStatusEnum("status").notNull().default("pending"),

  returnStatus: returnStatusEnum("return_status"), // สถานะตอนส่งคืน
  returnNotes: text("return_notes"), // หมายเหตุ (เช่น "ทำตกจากที่สูง")


  estimatedReturnAt: timestamp("estimated_return_at", { withTimezone: true }),

  requestedAt: timestamp("requested_at").defaultNow().notNull(),
});

// Job Attachments & History Files
export const jobAttachments = pgTable("job_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id")
    .references(() => jobs.id)
    .notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const jobHistoryFiles = pgTable("job_history_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  historyId: uuid("history_id")
    .references(() => jobHistory.id)
    .notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 50 }),
});

// Time Tracking
export const timeLogs = pgTable("time_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id")
    .references(() => jobs.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),
  durationMinutes: integer("duration_minutes"),
});

// =================== RELATIONS ===================

export const positionsRelations = relations(positions, ({ many }) => ({
  users: many(users),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
    reporter: one(users, {
        fields: [tickets.reportedById],
        references: [users.id],
        relationName: 'reporter'
    }),
    assignee: one(users, {
        fields: [tickets.assignedToId],
        references: [users.id],
        relationName: 'assignee'
    }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  position: one(positions, {
    fields: [users.positionId],
    references: [positions.id],
  }),
  createdJobs: many(jobs, { relationName: "createdBy" }),
  assignments: many(assignments),
  jobHistories: many(jobHistory),
  comments: many(jobComments),
  notifications: many(notifications),
  inventoryRequests: many(inventoryRequests),
  timeLogs: many(timeLogs),

  reportedTickets: many(tickets, { relationName: 'reporter' }),
  assignedTickets: many(tickets, { relationName: 'assignee' }),

}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  creator: one(users, {
    fields: [jobs.createdBy],
    references: [users.id],
    relationName: "createdBy",
  }),
  assignments: many(assignments),
  histories: many(jobHistory),
  comments: many(jobComments),
  attachments: many(jobAttachments),
  timeLogs: many(timeLogs),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  user: one(users, { fields: [assignments.userId], references: [users.id] }),
  job: one(jobs, { fields: [assignments.jobId], references: [jobs.id] }),
}));

export const jobHistoryRelations = relations(jobHistory, ({ one, many }) => ({
  job: one(jobs, { fields: [jobHistory.jobId], references: [jobs.id] }),
  employee: one(users, {
    fields: [jobHistory.employeeId],
    references: [users.id],
  }),
  files: many(jobHistoryFiles),
}));

export const jobCommentsRelations = relations(jobComments, ({ one }) => ({
  job: one(jobs, { fields: [jobComments.jobId], references: [jobs.id] }),
  user: one(users, { fields: [jobComments.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ many }) => ({
    requests: many(inventoryRequests),
  })
);

export const inventoryRequestsRelations = relations(
  inventoryRequests,
  ({ one }) => ({
    requester: one(users, {
      fields: [inventoryRequests.requesterId],
      references: [users.id],
    }),
    item: one(inventoryItems, {
      fields: [inventoryRequests.itemId],
      references: [inventoryItems.id],
    }),
    job: one(jobs, {
      fields: [inventoryRequests.jobId],
      references: [jobs.id],
    }),
  })
);

export const jobAttachmentsRelations = relations(jobAttachments, ({ one }) => ({
  job: one(jobs, { fields: [jobAttachments.jobId], references: [jobs.id] }),
  uploader: one(users, {
    fields: [jobAttachments.uploadedBy],
    references: [users.id],
  }),
}));

export const jobHistoryFilesRelations = relations(
  jobHistoryFiles,
  ({ one }) => ({
    history: one(jobHistory, {
      fields: [jobHistoryFiles.historyId],
      references: [jobHistory.id],
    }),
  })
);

export const timeLogsRelations = relations(timeLogs, ({ one }) => ({
  job: one(jobs, { fields: [timeLogs.jobId], references: [jobs.id] }),
  user: one(users, { fields: [timeLogs.userId], references: [users.id] }),
}));
