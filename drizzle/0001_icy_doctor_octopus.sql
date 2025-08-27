CREATE TABLE "cursor_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"ruleType" text DEFAULT 'always' NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cursor_rule" ADD CONSTRAINT "cursor_rule_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;