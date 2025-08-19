CREATE TABLE `used_device_fingerprint` (
	`fingerprint` text PRIMARY KEY NOT NULL,
	`meeting_id` text NOT NULL,
	`user_id` text NOT NULL,
	`first_used_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `checkin` ADD `device_fingerprint` text;