import { env } from "@acme/env/server";
import Fastify from "fastify";
import plugins from "./plugins";
import routes from "./routes";

export async function buildApp() {
	const isDev = env.NODE_ENV !== "production";

	const app = Fastify({
		trustProxy: true,
		logger: {
			level: isDev ? "debug" : "info",
			redact: [
				"req.headers.authorization",
				"req.headers.cookie",
				"body.password",
				"*.token",
			],
			transport: isDev
				? {
						target: "pino-pretty",
						options: {
							colorize: true,
							ignore: "pid,hostname",
							translateTime: "SYS:HH:MM:ss",
						},
					}
				: undefined,
		},
	});

	await app.register(plugins);
	await app.register(routes, { prefix: "/api" });

	return app;
}
