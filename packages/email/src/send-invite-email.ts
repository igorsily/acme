import { env } from "@acme/env/server";
import { render } from "@react-email/render";

import { getResendClient } from "./client";
import { UserInviteEmail } from "./templates/user-invite-email";

type SendUserInviteEmailInput = {
	to: string;
	name: string;
	inviteUrl: string;
};

export async function sendUserInviteEmail(input: SendUserInviteEmailInput) {
	if (!env.EMAIL_FROM) {
		throw new Error(
			"EMAIL_FROM não configurado. Defina a variável de ambiente para enviar e-mails."
		);
	}

	const html = await render(
		UserInviteEmail({
			inviteUrl: input.inviteUrl,
			name: input.name,
		})
	);

	const resend = getResendClient();
	const { error } = await resend.emails.send({
		from: env.EMAIL_FROM,
		to: input.to,
		subject: "Convite para acessar o Acme",
		html,
	});

	if (error) {
		throw new Error(error.message);
	}
}
