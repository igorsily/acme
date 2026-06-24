import * as Sentry from "@sentry/nextjs";

import { getServerSentryDsn, tracesSampleRate } from "./src/lib/sentry.server";

Sentry.init({
	dsn: getServerSentryDsn(),
	tracesSampleRate,
	enableLogs: true,
	sendDefaultPii: true,
});
