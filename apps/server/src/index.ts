import "./instrument";

import { env } from "@acme/env/server";
import * as Sentry from "@sentry/node";
import { buildApp } from "./app";

const startServer = async () => {
	try {
		const app = await buildApp();

		await app.listen({
			port: env.PORT,
			host: "0.0.0.0",
		});

		if (env.NODE_ENV !== "production") {
			app.swagger();
			app.log.info(
				`Documentation available at http://localhost:${env.PORT}/api/docs`
			);
		}
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error starting server:", error);
		process.exit(1);
	}
};

startServer();
