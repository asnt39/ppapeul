CREATE TABLE `daily_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`date` text NOT NULL,
	`goal` integer NOT NULL,
	`actual` integer NOT NULL,
	`updated` integer NOT NULL
);
