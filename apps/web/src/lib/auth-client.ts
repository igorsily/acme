import { env } from "@acme/env/web";
import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_SERVER_URL,
	fetchOptions: {
		credentials: "include",
	},
	plugins: [usernameClient()],
});
