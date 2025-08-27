CREATE TABLE "list" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "list_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"listId" text NOT NULL,
	"ruleId" text NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "list" ADD CONSTRAINT "list_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_rule" ADD CONSTRAINT "list_rule_listId_list_id_fk" FOREIGN KEY ("listId") REFERENCES "public"."list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_rule" ADD CONSTRAINT "list_rule_ruleId_cursor_rule_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."cursor_rule"("id") ON DELETE cascade ON UPDATE no action;