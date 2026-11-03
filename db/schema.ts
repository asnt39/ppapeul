import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{id:text('id').primaryKey(),token:text('token').notNull(),name:text('name').notNull(),status:text('status').notNull().default('쉬는 중'),updated:integer('updated').notNull().default(0)});
export const links=sqliteTable('links',{id:text('id').primaryKey(),sender:text('sender').notNull(),receiver:text('receiver').notNull(),state:text('state').notNull().default('pending')});
export const messages=sqliteTable('messages',{id:text('id').primaryKey(),sender:text('sender').notNull(),receiver:text('receiver').notNull(),body:text('body').notNull(),created:integer('created').notNull()});
export const sessions=sqliteTable('sessions',{id:text('id').primaryKey(),owner:text('owner').notNull(),subject:text('subject').notNull(),seconds:integer('seconds').notNull(),created:integer('created').notNull()});

export const dailyStats=sqliteTable("daily_stats",{id:text("id").primaryKey(),owner:text("owner").notNull(),date:text("date").notNull(),goal:integer("goal").notNull(),actual:integer("actual").notNull(),updated:integer("updated").notNull()});

export const pushDevices=sqliteTable('push_devices',{id:text('id').primaryKey(),owner:text('owner').notNull(),endpoint:text('endpoint').notNull().unique(),secret:text('secret').notNull().unique(),preferences:text('preferences').notNull(),timezone:text('timezone').notNull(),dailyTime:text('daily_time').notNull(),snapshot:text('snapshot').notNull()});
export const pushEvents=sqliteTable('push_events',{id:text('id').primaryKey(),device:text('device').notNull(),payload:text('payload').notNull(),created:integer('created').notNull(),delivered:integer('delivered').notNull().default(0)});

export const aiQuotas=sqliteTable('ai_quotas',{id:text('id').primaryKey(),count:integer('count').notNull().default(0)});
