CREATE TABLE `meetings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`meeting_date` text NOT NULL,
	`agenda` text NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`value` real NOT NULL,
	`target` real NOT NULL,
	`unit` text NOT NULL,
	`measured_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`objective` text NOT NULL,
	`status` text NOT NULL,
	`health` text NOT NULL,
	`progress` integer NOT NULL,
	`budget` real NOT NULL,
	`spent` real NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`assignee` text NOT NULL,
	`due_date` text NOT NULL,
	`status` text NOT NULL,
	`priority` text NOT NULL,
	`critical` integer NOT NULL,
	`depends_on` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
