import { env } from "@acme/env/server";
import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
	if (!env.RESEND_API_KEY) {
		throw new Error(
			"RESEND_API_KEY não configurada. Defina a variável de ambiente para enviar e-mails."
		);
	}

	resendClient ??= new Resend(env.RESEND_API_KEY);
	return resendClient;
}
