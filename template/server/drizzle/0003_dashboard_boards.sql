CREATE TABLE `dashboard_boards` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`owner_id` text DEFAULT '' NOT NULL,
	`widgets` text NOT NULL,
	`layout` text NOT NULL,
	`filters` text DEFAULT '[]' NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dashboard_boards_scope_owner` ON `dashboard_boards` (`scope`,`owner_id`);--> statement-breakpoint
CREATE TABLE `saved_filters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`source` text NOT NULL,
	`scope` text NOT NULL,
	`tree` text NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	`archived_by` text
);
--> statement-breakpoint
CREATE INDEX `saved_filters_owner_idx` ON `saved_filters` (`owner_id`);