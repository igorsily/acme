import { runMigrations } from "@acme/db/migrate";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	console.error("DATABASE_URL is required");
	process.exit(1);
}

try {
	await runMigrations(databaseUrl);
	process.exit(0);
} catch (error) {
	console.error("Migration failed:", error);
	process.exit(1);
}
