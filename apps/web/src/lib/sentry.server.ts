import { env } from "@acme/env/web";

export function getServerSentryDsn(): string | undefined {
	return env.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN;
}

export const tracesSampleRate = env.NODE_ENV === "development" ? 1.0 : 0.1;

export const tracePropagationTargets: Array<string | RegExp> = [
	env.NEXT_PUBLIC_SERVER_URL,
	/^\//,
];
