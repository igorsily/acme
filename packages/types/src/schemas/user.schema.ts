import z from "zod";

export const userListSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.email(),
	role: z.string().nullable(),
	banned: z.boolean().nullable(),
	emailVerified: z.boolean(),
});

export const userCreateSchema = z.object({
	name: z.string().trim().min(2, "Informe o nome completo"),
	email: z.email("Informe um e-mail válido"),
	sendInvitationEmail: z.boolean(),
});

export const userResendInviteSchema = z.object({
	userId: z.string().min(1),
});

export const userInviteTokenSchema = z.object({
	token: z.uuid("Token de convite inválido"),
});

const userCompleteInviteBaseSchema = z.object({
	token: z.uuid("Token de convite inválido"),
	username: z
		.string()
		.trim()
		.min(3, "O usuário precisa ter pelo menos 3 caracteres"),
	password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
	confirmPassword: z.string().min(8, "Confirme a senha"),
});

export const userCompleteInviteFormSchema = userCompleteInviteBaseSchema
	.omit({ token: true })
	.refine((values) => values.password === values.confirmPassword, {
		message: "As senhas não coincidem",
		path: ["confirmPassword"],
	});

export const userCompleteInviteSchema = userCompleteInviteBaseSchema.refine(
	(values) => values.password === values.confirmPassword,
	{
		message: "As senhas não coincidem",
		path: ["confirmPassword"],
	}
);

export const userInvitePreviewSchema = z.object({
	name: z.string(),
	email: z.email(),
	expiresAt: z.date(),
});

export type UserList = z.infer<typeof userListSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserResendInviteInput = z.infer<typeof userResendInviteSchema>;
export type UserInviteTokenInput = z.infer<typeof userInviteTokenSchema>;
export type UserCompleteInviteInput = z.infer<typeof userCompleteInviteSchema>;
export type UserCompleteInviteFormInput = z.infer<
	typeof userCompleteInviteFormSchema
>;
export type UserInvitePreview = z.infer<typeof userInvitePreviewSchema>;
