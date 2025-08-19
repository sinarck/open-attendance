CREATE TABLE `attendee_directory` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `checkin` (
	`id` text PRIMARY KEY NOT NULL,
	`meeting_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`lat` real,
	`lng` real,
	`accuracy_m` real,
	`user_agent_hash` text,
	`ip_hash` text,
	`kiosk_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `checkin_meeting_user_unique` ON `checkin` (`meeting_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `meeting` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`start_at` integer,
	`end_at` integer,
	`center_lat` real NOT NULL,
	`center_lng` real NOT NULL,
	`radius_m` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `used_token_nonce` (
	`nonce` text PRIMARY KEY NOT NULL,
	`meeting_id` text NOT NULL,
	`kiosk_id` text NOT NULL,
	`consumed_at` integer NOT NULL
);
