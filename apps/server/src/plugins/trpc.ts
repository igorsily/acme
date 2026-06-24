import { createContext } from "@acme/api/context";
import { type AppRouter, appRouter } from "@acme/api/routers/index";
import * as Sentry from "@sentry/node";
import { TRPCError } from "@trpc/server";
import {
	type FastifyTRPCPluginOptions,
	fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import fp from "fastify-plugin";

function shouldReportTrpcError(error: unknown): boolean {
	if (error instanceof TRPCError) {
		return error.code === "INTERNAL_SERVER_ERROR";
	}

	return true;
}

export default fp(async (fastify) => {
	await fastify.register(fastifyTRPCPlugin, {
		prefix: "/api/trpc",
		trpcOptions: {
			router: appRouter,
			createContext,
			onError({ path, error, type }) {
				fastify.log.error(
					{ err: error },
					`Error in tRPC handler on path '${path}':`
				);

				if (shouldReportTrpcError(error)) {
					Sentry.captureException(error, {
						extra: { path, type },
					});
				}
			},
		} satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
	});
});
