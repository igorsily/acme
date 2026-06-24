import * as Sentry from "@sentry/nextjs";

import {
	getServerSentryDsn,
	tracePropagationTargets,
	tracesSampleRate,
} from "./src/lib/sentry.server";

Sentry.init({
	dsn: getServerSentryDsn(),
	tracesSampleRate,
	tracePropagationTargets,
	includeLocalVariables: true,
	enableLogs: true,
	sendDefaultPii: true,
});
