import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  real,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Local mirror of every booking made through the public landing page.
 * Each row is also pushed to the Sparta Royale dashboard (Turso/libSQL)
 * `appointments` table when TURSO_URL / TURSO_TOKEN are configured.
 */
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientPhone: varchar("client_phone", { length: 50 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }),
  service: varchar("service", { length: 255 }).notNull(),
  preferredDate: varchar("preferred_date", { length: 50 }).notNull(),
  preferredTime: varchar("preferred_time", { length: 50 }).notNull(),
  duration: integer("duration"),
  price: real("price"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  syncedToDashboard: boolean("synced_to_dashboard").notNull().default(false),
  dashboardId: varchar("dashboard_id", { length: 128 }),
  syncError: text("sync_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
