CREATE TABLE push_devices (id text PRIMARY KEY NOT NULL,owner text NOT NULL,endpoint text NOT NULL,secret text NOT NULL,preferences text NOT NULL,timezone text NOT NULL,daily_time text NOT NULL,snapshot text NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX push_devices_endpoint_unique ON push_devices(endpoint);
--> statement-breakpoint
CREATE UNIQUE INDEX push_devices_secret_unique ON push_devices(secret);
--> statement-breakpoint
CREATE TABLE push_events (id text PRIMARY KEY NOT NULL,device text NOT NULL,payload text NOT NULL,created integer NOT NULL,delivered integer DEFAULT 0 NOT NULL);
--> statement-breakpoint
CREATE INDEX push_events_device_created ON push_events(device,created);
