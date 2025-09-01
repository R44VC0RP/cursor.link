CREATE TABLE "deviceCode" (
	"id" text PRIMARY KEY NOT NULL,
	"deviceCode" text NOT NULL,
	"userCode" text NOT NULL,
	"userId" text,
	"clientId" text,
	"scope" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"lastPolledAt" timestamp,
	"pollingInterval" integer,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deviceCode" ADD CONSTRAINT "deviceCode_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;