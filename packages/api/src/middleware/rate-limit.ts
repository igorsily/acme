import { env } from "@acme/env/server";
import { TRPCError } from "@trpc/server";
import Redis from "ioredis";

import { t } from "../index";

let redis: Redis | null = null;

function getRedis(): Redis | null {
	if (!env.REDIS_URL) {
		return null;
	}

	redis ??= new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1 });
	return redis;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function checkMemoryRateLimit(
	key: string,
	limit: number,
	windowMs: number
): boolean {
	const now = Date.now();
	const entry = memoryStore.get(key);

	if (!entry || now > entry.resetAt) {
		memoryStore.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}

	entry.count += 1;
	return entry.count <= limit;
}

export async function checkRateLimit(
	key: string,
	{ limit, windowMs }: { limit: number; windowMs: number }
): Promise<boolean> {
	const client = getRedis();

	if (!client) {
		return checkMemoryRateLimit(key, limit, windowMs);
	}

	const count = await client.incr(key);
	if (count === 1) {
		await client.pexpire(key, windowMs);
	}

	return count <= limit;
}

export function rateLimit(opts: {
	keyPrefix: string;
	limit: number;
	windowMs: number;
}) {
	return t.middleware(async ({ ctx, next }) => {
		if (!ctx.userId) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}

		const allowed = await checkRateLimit(`${opts.keyPrefix}:${ctx.userId}`, {
			limit: opts.limit,
			windowMs: opts.windowMs,
		});

		if (!allowed) {
			throw new TRPCError({
				code: "TOO_MANY_REQUESTS",
				message: "Limite de requisições excedido. Tente novamente em 1 minuto.",
			});
		}

		return next();
	});
}
