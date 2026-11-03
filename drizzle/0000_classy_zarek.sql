CREATE TABLE `links` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`receiver` text NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`receiver` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT '쉬는 중' NOT NULL,
	`updated` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`subject` text NOT NULL,
	`seconds` integer NOT NULL,
	`created` integer NOT NULL
);
