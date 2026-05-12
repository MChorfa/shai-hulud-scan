import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";

export const packages = sqliteTable("packages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  version: text("version").notNull(),
  ecosystem: text("ecosystem").default("npm"),
  firstSeen: text("first_seen").default(new Date().toISOString()),
  riskLevel: text("risk_level").default("high"),
  description: text("description"),
  maintainer: text("maintainer"),
  downloadCount: integer("download_count").default(0),
  embedding: blob("embedding"),
  campaign: text("campaign").default("shai-hulud-2"),
});

export const iocs = sqliteTable("iocs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  value: text("value").notNull(),
  campaign: text("campaign").default("mini-shai-hulud"),
  description: text("description"),
  firstSeen: text("first_seen").default(new Date().toISOString()),
});

export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;
export type Ioc = typeof iocs.$inferSelect;
export type NewIoc = typeof iocs.$inferInsert;
