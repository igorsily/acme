import { text, timestamp } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";
import { user } from "./auth";

export const baseColumns = () => ({
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv7()),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const baseColumnsWithUserId = () => ({
	...baseColumns(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});
