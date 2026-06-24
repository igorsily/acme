import { createListService } from "@acme/api/helper/list-service";
import { user } from "@acme/db/schema/auth";
import {
	listParamsSchema,
	listResponseSchema,
} from "@acme/types/schemas/common.schema";
import {
	userCompleteInviteSchema,
	userCreateSchema,
	userInvitePreviewSchema,
	userInviteTokenSchema,
	userListSchema,
	userResendInviteSchema,
} from "@acme/types/schemas/user.schema";
import { desc } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../index";
import {
	completeUserInvite,
	createUser,
	getInviteByToken,
	resendUserInvite,
} from "../services/user-service";

const userListResponseSchema = listResponseSchema(userListSchema);

const filterableColumns = {
	name: user.name,
	email: user.email,
	banned: user.banned,
	emailVerified: user.emailVerified,
} satisfies Record<string, PgColumn>;

const sortableColumns = {
	name: user.name,
	email: user.email,
	createdAt: user.createdAt,
	emailVerified: user.emailVerified,
} satisfies Record<string, PgColumn>;

const listUsers = createListService({
	table: user,
	filterableColumns,
	sortableColumns,
	defaultOrderBy: [desc(user.createdAt)],
	searchColumns: [user.name, user.email],
});

export const userRouter = router({
	list: protectedProcedure
		.input(listParamsSchema)
		.output(userListResponseSchema)
		.query(async ({ input }) =>
			userListResponseSchema.parse(await listUsers(input))
		),

	create: protectedProcedure
		.input(userCreateSchema)
		.output(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) =>
			createUser(input, { headers: ctx.headers })
		),

	resendInvite: protectedProcedure
		.input(userResendInviteSchema)
		.output(z.object({ success: z.literal(true) }))
		.mutation(async ({ input }) => resendUserInvite(input.userId)),

	getInviteByToken: publicProcedure
		.input(userInviteTokenSchema)
		.output(userInvitePreviewSchema)
		.query(async ({ input }) => getInviteByToken(input.token)),

	completeInvite: publicProcedure
		.input(userCompleteInviteSchema)
		.output(z.object({ email: z.email() }))
		.mutation(async ({ input }) => completeUserInvite(input)),
});
export type UserRouter = typeof userRouter;
