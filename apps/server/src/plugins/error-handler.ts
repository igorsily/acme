import * as Sentry from "@sentry/node";
import type { FastifyError, FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

function shouldReportToSentry(statusCode: number): boolean {
	return statusCode >= 500;
}

const errorHandlerPlugin: FastifyPluginCallback = (fastify, _options, done) => {
	fastify.setErrorHandler((error: FastifyError, request, reply) => {
		request.log.error({ err: error }, "Request error:");

		if (error.validation) {
			return reply.code(400).send({
				statusCode: 400,
				error: "Bad Request",
				message: "Validation failed",
				details: error.validation,
			});
		}

		const statusCode = error.statusCode ?? 500;
		const code = error.code ?? "INTERNAL_ERROR";

		if (shouldReportToSentry(statusCode)) {
			Sentry.captureException(error, {
				extra: {
					method: request.method,
					url: request.url,
					statusCode,
				},
			});
		}

		// Don't expose internal error details in production
		const message =
			statusCode >= 500 && process.env.NODE_ENV === "production"
				? "Internal Server Error"
				: error.message;

		return reply.code(statusCode).send({
			statusCode,
			error: code,
			message,
		});
	});
	done();
};

export default fp(errorHandlerPlugin);
