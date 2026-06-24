import { existsSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

function resolveMigrationsFolder(): string {
	if (process.env.MIGRATIONS_FOLDER) {
		return process.env.MIGRATIONS_FOLDER;
	}

	const candidates = [
		path.join(process.cwd(), "migrations"),
		path.join(process.cwd(), "../../packages/db/src/migrations"),
	];

	for (const folder of candidates) {
		if (existsSync(path.join(folder, "meta", "_journal.json"))) {
			return folder;
		}
	}

	throw new Error(
		"Migrations folder not found. Set MIGRATIONS_FOLDER or run from apps/server."
	);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function isConnectionError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	const message = error.message.toLowerCase();
	return (
		message.includes("econnrefused") ||
		message.includes("connect") ||
		message.includes("timeout") ||
		message.includes("enotfound")
	);
}

export async function runMigrations(databaseUrl: string): Promise<void> {
	const migrationsFolder = resolveMigrationsFolder();
	const pool = new pg.Pool({ connectionString: databaseUrl });
	const db = drizzle(pool);

	try {
		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				await migrate(db, { migrationsFolder });
				return;
			} catch (error) {
				if (!isConnectionError(error) || attempt === MAX_RETRIES) {
					throw error;
				}

				await sleep(RETRY_DELAY_MS);
			}
		}
	} finally {
		await pool.end();
	}
}
