import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const cursorRule = pgTable("cursor_rule", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  ruleType: text("ruleType").notNull().default("always"), // always, intelligent, specific, manual
  isPublic: boolean("isPublic").notNull().default(false),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const list = pgTable("list", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const listRule = pgTable("list_rule", {
  id: text("id").primaryKey(),
  listId: text("listId").notNull().references(() => list.id, { onDelete: "cascade" }),
  ruleId: text("ruleId").notNull().references(() => cursorRule.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull(),
})

export const rating = pgTable("rating", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  ruleId: text("ruleId").notNull().references(() => cursorRule.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const comment = pgTable("comment", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  ruleId: text("ruleId").notNull().references(() => cursorRule.id, { onDelete: "cascade" }),
  parentId: text("parentId").references(() => comment.id, { onDelete: "cascade" }), // For replies
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const report = pgTable("report", {
  id: text("id").primaryKey(),
  reporterId: text("reporterId").notNull().references(() => user.id, { onDelete: "cascade" }),
  commentId: text("commentId").references(() => comment.id, { onDelete: "cascade" }),
  ruleId: text("ruleId").references(() => cursorRule.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(), // spam, inappropriate, harassment, etc.
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, reviewed, resolved
  createdAt: timestamp("createdAt").notNull(),
})
