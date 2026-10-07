ALTER TABLE `tasks` ADD `parent_id` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `notes` text DEFAULT '' NOT NULL;