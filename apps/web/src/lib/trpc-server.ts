import "server-only";

import type { AppRouter } from "@acme/api";
import { env } from "@acme/env/web";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache } from "react";
import superjson from "superjson";

const FIVE_MINUTES_IN_MS = 1000 * 60 * 5;
const SERVER_TRPC_URL = `${env.NEXT_PUBLIC_SERVER_URL}/api/trpc`;

export const getServerQueryClient = cache(
	() =>
		new QueryClient({
			defaultOptions: {
				queries: {
					retry: 1,
					staleTime: FIVE_MINUTES_IN_MS,
				},
			},
		})
);

export const trpcServerClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: SERVER_TRPC_URL,
			transformer: superjson,
			async headers() {
				const requestHeaders = await headers();
				const cookie = requestHeaders.get("cookie");

				if (!cookie) {
					return {};
				}

				return { cookie };
			},
		}),
	],
});

export const trpcServer = createTRPCOptionsProxy<AppRouter>({
	client: trpcServerClient,
	queryClient: getServerQueryClient,
});
