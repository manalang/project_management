CREATE INDEX `idx_tasks_owner_due` ON `tasks` (`owner_id`,`due_date`);--> statement-breakpoint
CREATE INDEX `idx_tasks_owner_project` ON `tasks` (`owner_id`,`project_id`);--> statement-breakpoint
CREATE INDEX `idx_tasks_parent` ON `tasks` (`parent_id`);