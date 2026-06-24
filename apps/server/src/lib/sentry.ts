import { env } from "@acme/env/server";

export function getSentryDsn(): string | undefined {
	return env.SENTRY_DSN_API;
}

export const tracesSampleRate = env.NODE_ENV === "development" ? 1.0 : 0.1;
