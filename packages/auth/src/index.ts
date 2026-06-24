import { createDb } from "@acme/db";
import * as schema from "@acme/db/schema/auth";
import { env } from "@acme/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";

export function createAuth() {
	const db = createDb();
	const isProduction = env.NODE_ENV === "production";
	const crossSubDomainCookies = env.AUTH_COOKIE_DOMAIN
		? {
				enabled: true as const,
				domain: env.AUTH_COOKIE_DOMAIN,
			}
		: undefined;

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN, env.BETTER_AUTH_URL],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			...(crossSubDomainCookies ? { crossSubDomainCookies } : {}),
			defaultCookieAttributes: {
				sameSite: isProduction ? "none" : "lax",
				secure: isProduction,
				httpOnly: true,
			},
		},
		plugins: [
			username({
				displayUsernameNormalization: (value) => value.trim().toLowerCase(),
			}),
			admin({
				adminRoles: ["admin"],
				defaultRole: "user",
			}),
		],
	});
}

export const auth = createAuth();
