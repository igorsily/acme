import * as Sentry from "@sentry/node";

import { getSentryDsn, tracesSampleRate } from "./lib/sentry";

const dsn = getSentryDsn();

if (dsn) {
	Sentry.init({
		dsn,
		environment: process.env.NODE_ENV,
		tracesSampleRate,
		includeLocalVariables: true,
		enableLogs: true,
		sendDefaultPii: true,
	});
}
