import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(),
  name: text("name").notNull(), code: text("code").notNull(),
  objective: text("objective").notNull(), status: text("status").notNull(),
  health: text("health").notNull(), progress: integer("progress").notNull(),
  budget: real("budget").notNull(), spent: real("spent").notNull(),
  startDate: text("start_date").notNull(), endDate: text("end_date").notNull(),
});
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(),
  projectId: text("project_id").notNull().references(()=>projects.id),
  title: text("title").notNull(), assignee: text("assignee").notNull(),
  dueDate: text("due_date").notNull(), status: text("status").notNull(),
  priority: text("priority").notNull(), critical: integer("critical",{mode:"boolean"}).notNull(),
  dependsOn: text("depends_on"),
});
export const meetings = sqliteTable("meetings", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(),
  projectId: text("project_id").notNull().references(()=>projects.id),
  title: text("title").notNull(), meetingDate: text("meeting_date").notNull(),
  agenda: text("agenda").notNull(), notes: text("notes").notNull(),
});
export const metrics = sqliteTable("metrics", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(),
  projectId: text("project_id").notNull().references(()=>projects.id),
  name: text("name").notNull(), value: real("value").notNull(),
  target: real("target").notNull(), unit: text("unit").notNull(),
  measuredAt: text("measured_at").notNull(),
});
export const projectDocuments = sqliteTable("project_documents", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  projectId: text("project_id").references(()=>projects.id),
  draftId: text("draft_id").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  r2Key: text("r2_key").notNull(),
  excerpt: text("excerpt").notNull(),
  createdAt: text("created_at").notNull(),
});
