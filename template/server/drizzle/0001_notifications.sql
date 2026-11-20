CREATE TABLE `notification_settings` (
	`topic` text PRIMARY KEY NOT NULL,
	`is_enabled` integer NOT NULL,
	`severity` text NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_id` text NOT NULL,
	`topic` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`action_label` text,
	`action_to` text,
	`dedupe_key` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`read_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_recipient_dedupe_idx` ON `notifications` (`recipient_id`,`dedupe_key`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_created_idx` ON `notifications` (`recipient_id`,`created_at`);