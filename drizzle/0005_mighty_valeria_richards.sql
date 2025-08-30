CREATE TABLE "comment" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"ruleId" text NOT NULL,
	"parentId" text,
	"content" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rating" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"ruleId" text NOT NULL,
	"rating" integer NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_ruleId_cursor_rule_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."cursor_rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parentId_comment_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_ruleId_cursor_rule_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."cursor_rule"("id") ON DELETE cascade ON UPDATE no action;