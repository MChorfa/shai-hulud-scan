import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

export const packages = sqliteTable('packages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  version: text('version').notNull(),
  ecosystem: text('ecosystem').default('npm'),
  firstSeen: text('first_seen').default(new Date().toISOString()),
  riskLevel: text('risk_level').default('high'),
  description: text('description'),
  maintainer: text('maintainer'),
  downloadCount: integer('download_count').default(0),
  embedding: blob('embedding'),
});

export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;
