import { randomUUID } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { auth } from "@acme/auth";
import { hashPassword } from "@acme/auth/password";
import { db } from "@acme/db";
import { account, user, verification } from "@acme/db/schema/auth";
import { env } from "@acme/env/server";
import type {
	UserCompleteInviteInput,
	UserCreateInput,
	UserInvitePreview,
} from "@acme/types/schemas/user.schema";
import { TRPCError } from "@trpc/server";
import { fromNodeHeaders } from "better-auth/node";
import { and, eq, isNotNull } from "drizzle-orm";

export const INVITE_IDENTIFIER_PREFIX = "user-invite:";
export const INVITE_TTL_DAYS = 7;

type CreateUserContext = {
	headers: IncomingHttpHeaders;
};

function normalizeUsername(value: string): string {
	return value.trim().toLowerCase();
}

function getInviteExpiresAt(): Date {
	return new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function parseInviteUserId(identifier: string): string | null {
	if (!identifier.startsWith(INVITE_IDENTIFIER_PREFIX)) {
		return null;
	}

	const userId = identifier.slice(INVITE_IDENTIFIER_PREFIX.length);
	return userId.length > 0 ? userId : null;
}

function buildInviteUrl(token: string): string {
	return `${env.CORS_ORIGIN}/convite/${token}`;
}

async function assertUserCanReceiveInvite(userId: string) {
	const [existingUser] = await db
		.select({
			id: user.id,
			email: user.email,
			emailVerified: user.emailVerified,
			name: user.name,
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!existingUser) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Usuário não encontrado.",
		});
	}

	if (existingUser.emailVerified) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Este usuário já concluiu o cadastro.",
		});
	}

	const [credentialAccount] = await db
		.select({ id: account.id })
		.from(account)
		.where(
			and(
				eq(account.userId, userId),
				eq(account.providerId, "credential"),
				isNotNull(account.password)
			)
		)
		.limit(1);

	if (credentialAccount) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Este usuário já possui credenciais configuradas.",
		});
	}

	return existingUser;
}

async function replaceInviteToken(userId: string): Promise<string> {
	await db
		.delete(verification)
		.where(eq(verification.identifier, `${INVITE_IDENTIFIER_PREFIX}${userId}`));

	const token = randomUUID();

	await db.insert(verification).values({
		identifier: `${INVITE_IDENTIFIER_PREFIX}${userId}`,
		value: token,
		expiresAt: getInviteExpiresAt(),
	});

	return token;
}

async function sendInviteEmailForUser(
	targetUser: {
		email: string;
		name: string;
	},
	token: string
) {
	const { sendUserInviteEmail } = await import("@acme/email");

	await sendUserInviteEmail({
		to: targetUser.email,
		name: targetUser.name,
		inviteUrl: buildInviteUrl(token),
	});
}

export async function createUser(
	input: UserCreateInput,
	context: CreateUserContext
) {
	const email = input.email.toLowerCase();

	let createdUserId: string;

	try {
		const result = await auth.api.createUser({
			body: {
				email,
				name: input.name,
			},
			headers: fromNodeHeaders(context.headers),
		});

		createdUserId = result.user.id;
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Falha ao criar usuário.";

		if (message.toLowerCase().includes("already exists")) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Já existe um usuário com este e-mail.",
			});
		}

		throw new TRPCError({
			code: "BAD_REQUEST",
			message,
		});
	}

	const token = await replaceInviteToken(createdUserId);

	if (input.sendInvitationEmail) {
		try {
			await sendInviteEmailForUser(
				{
					email,
					name: input.name,
				},
				token
			);
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message:
					error instanceof Error
						? error.message
						: "Usuário criado, mas falha ao enviar o e-mail de convite.",
			});
		}
	}

	return { id: createdUserId };
}

export async function resendUserInvite(userId: string) {
	const targetUser = await assertUserCanReceiveInvite(userId);
	const token = await replaceInviteToken(userId);

	try {
		await sendInviteEmailForUser(targetUser, token);
	} catch (error) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message:
				error instanceof Error
					? error.message
					: "Falha ao reenviar o e-mail de convite.",
		});
	}

	return { success: true as const };
}

export async function getInviteByToken(
	token: string
): Promise<UserInvitePreview> {
	const [inviteRecord] = await db
		.select()
		.from(verification)
		.where(eq(verification.value, token))
		.limit(1);

	if (!inviteRecord) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Convite inválido ou expirado.",
		});
	}

	if (inviteRecord.expiresAt.getTime() <= Date.now()) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Este convite expirou. Solicite um novo convite ao administrador.",
		});
	}

	const userId = parseInviteUserId(inviteRecord.identifier);

	if (!userId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Convite inválido ou expirado.",
		});
	}

	const [inviteUser] = await db
		.select({
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!inviteUser || inviteUser.emailVerified) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Este convite já foi utilizado.",
		});
	}

	return {
		name: inviteUser.name,
		email: inviteUser.email,
		expiresAt: inviteRecord.expiresAt,
	};
}

export async function completeUserInvite(input: UserCompleteInviteInput) {
	const invitePreview = await getInviteByToken(input.token);
	const [inviteRecord] = await db
		.select()
		.from(verification)
		.where(eq(verification.value, input.token))
		.limit(1);

	if (!inviteRecord) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Convite inválido ou expirado.",
		});
	}

	const userId = parseInviteUserId(inviteRecord.identifier);

	if (!userId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Convite inválido ou expirado.",
		});
	}

	const normalizedUsername = normalizeUsername(input.username);

	const [usernameTaken] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.username, normalizedUsername))
		.limit(1);

	if (usernameTaken && usernameTaken.id !== userId) {
		throw new TRPCError({
			code: "CONFLICT",
			message: "Este usuário já está em uso.",
		});
	}

	const passwordHash = await hashPassword(input.password);

	await db.transaction(async (tx) => {
		await tx
			.update(user)
			.set({
				username: normalizedUsername,
				displayUsername: input.username.trim(),
				emailVerified: true,
			})
			.where(eq(user.id, userId));

		await tx.insert(account).values({
			userId,
			accountId: userId,
			providerId: "credential",
			password: passwordHash,
		});

		await tx.delete(verification).where(eq(verification.value, input.token));
	});

	return {
		email: invitePreview.email,
	};
}
