CREATE TABLE `project_access` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`project_id` text NOT NULL,
	`project_role` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `workspace_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_access_member` ON `project_access` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_project_access_project` ON `project_access` (`project_id`);--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_owner_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_members_email` ON `workspace_members` (`email`);--> statement-breakpoint
CREATE INDEX `idx_members_workspace` ON `workspace_members` (`workspace_owner_id`);