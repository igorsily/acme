import { withSentryConfig } from "@sentry/nextjs";
import "@acme/env/web";
import path from "node:path";
import type { NextConfig } from "next";

const isStandaloneBuild = process.env.STANDALONE_BUILD === "true";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,

	...(isStandaloneBuild && {
		output: "standalone",
		outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
	}),
};

export default withSentryConfig(nextConfig, {
	org: process.env.SENTRY_ORG ?? "igor-sily",
	project: process.env.SENTRY_PROJECT ?? "acme-web",
	authToken: process.env.SENTRY_AUTH_TOKEN,
	silent: !process.env.CI,
	widenClientFileUpload: true,
	tunnelRoute: "/monitoring",
	webpack: {
		automaticVercelMonitors: true,
		treeshake: {
			removeDebugLogging: true,
		},
	},
});
