import { auth } from "@acme/auth";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { fromNodeHeaders } from "better-auth/node";

export async function createContext({ req }: CreateFastifyContextOptions) {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});

	const userId = session ? session.user.id : null;
	const role = session?.user.role;

	return {
		auth: null,
		headers: req.headers,
		role,
		session,
		userId,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
