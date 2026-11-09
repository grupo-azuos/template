CREATE TABLE `history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`target_label` text,
	`changes` text DEFAULT '[]' NOT NULL,
	`actor_id` text,
	`actor_email` text,
	`actor_name` text,
	`occurred_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `history_target_idx` ON `history` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `history_occurred_at_idx` ON `history` (`occurred_at`);