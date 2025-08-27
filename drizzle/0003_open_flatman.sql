CREATE TABLE "rule_like" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"ruleId" text NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cursor_rule" ADD COLUMN "likes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rule_like" ADD CONSTRAINT "rule_like_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_like" ADD CONSTRAINT "rule_like_ruleId_cursor_rule_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."cursor_rule"("id") ON DELETE cascade ON UPDATE no action;