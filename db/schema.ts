import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(),
  name: text("name").notNull(), code: text("code").notNull(),
  objective: text("objective").notNull(), status: text("status").notNull(),
  health: text("health").notNull(), progress: integer("progress").notNull(),
  budget: real("budget").notNull(), spent: real("spent").notNull(),
  startDate: text("start_date").notNull(), endDate: text("end_date").notNull(),
  color: text("color").notNull().default("#2f8f9d"),
});
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(),
  projectId: text("project_id").notNull().references(()=>projects.id),
  title: text("title").notNull(), assignee: text("assignee").notNull(),
  dueDate: text("due_date").notNull(), status: text("status").notNull(),
  priority: text("priority").notNull(), critical: integer("critical",{mode:"boolean"}).notNull(),
  dependsOn: text("depends_on"),
  parentId: text("parent_id"),
  description: text("description").notNull().default(""),
  notes: text("notes").notNull().default(""),
}, (table)=>[
  index("idx_tasks_owner_due").on(table.ownerId,table.dueDate),
  index("idx_tasks_owner_project").on(table.ownerId,table.projectId),
  index("idx_tasks_parent").on(table.parentId),
]);
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
export const workspaceMembers = sqliteTable("workspace_members", {
  id: text("id").primaryKey(), workspaceOwnerId: text("workspace_owner_id").notNull(),
  email: text("email").notNull(), name: text("name").notNull(),
  role: text("role").notNull(), createdAt: text("created_at").notNull(),
}, (table)=>[
  index("idx_members_email").on(table.email),
  index("idx_members_workspace").on(table.workspaceOwnerId),
]);
export const projectAccess = sqliteTable("project_access", {
  id: text("id").primaryKey(), memberId: text("member_id").notNull().references(()=>workspaceMembers.id),
  projectId: text("project_id").notNull().references(()=>projects.id), projectRole: text("project_role").notNull(),
}, (table)=>[
  index("idx_project_access_member").on(table.memberId),
  index("idx_project_access_project").on(table.projectId),
]);
