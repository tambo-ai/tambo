import { mysqlTable, varchar, int, text } from 'drizzle-orm/mysql-core';

export const contacts = mysqlTable('contacts', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  notes: text('notes'),
});

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
