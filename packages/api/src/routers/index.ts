import { protectedProcedure, publicProcedure, router } from "../index";
import { itemRouter } from "./item";
import { userRouter } from "./user";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "This is private",
		user: ctx.session.user,
	})),
	user: userRouter,
	item: itemRouter,
});
export type AppRouter = typeof appRouter;
