import { boolean, geometry, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { baseColumns } from "./base-columns";

export const itemStatus = pgEnum("item_status", [
	"draft",
	"active",
	"archived",
]);

export const item = pgTable("item", {
	...baseColumns(),
	name: text("name").notNull(),
	description: text("description"),
	status: itemStatus("status").default("draft").notNull(),
	address: text("address"),
	coordinate: geometry("coordinate", {
		type: "point",
		mode: "xy",
		srid: 4326,
	}),
	slug: text("slug").unique(),
	deleted: boolean("deleted").default(false).notNull(),
});
