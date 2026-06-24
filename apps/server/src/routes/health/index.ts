import type { FastifyPluginCallback } from "fastify";

const healthRoutes: FastifyPluginCallback = (fastify, _options, done) => {
	fastify.get(
		"/",
		{
			schema: {
				description: "Health check",
				tags: ["health"],
				summary: "Server health check",
				response: {
					200: {
						description: "Successful response",
						type: "object",
						properties: {
							status: { type: "string" },
						},
					},
				},
			},
		},
		() => ({ status: "ok" })
	);
	done();
};

export default healthRoutes;
