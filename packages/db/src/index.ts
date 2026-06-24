import { env } from "@acme/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as authSchema from "./schema/auth";
import * as itemSchema from "./schema/item";

export const schema = {
	...authSchema,
	...itemSchema,
};

export function createDb() {
	return drizzle(env.DATABASE_URL, { schema, casing: "snake_case" });
}

export const db = createDb();

// Import drizzle helpers directly from "drizzle-orm" in consuming code.

export type { PgColumn } from "drizzle-orm/pg-core";
