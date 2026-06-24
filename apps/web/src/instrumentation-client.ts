import * as Sentry from "@sentry/nextjs";

import {
	getClientSentryDsn,
	tracePropagationTargets,
	tracesSampleRate,
} from "@/lib/sentry.client";

Sentry.init({
	dsn: getClientSentryDsn(),
	integrations: [Sentry.replayIntegration()],
	tracesSampleRate,
	tracePropagationTargets,
	enableLogs: true,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
