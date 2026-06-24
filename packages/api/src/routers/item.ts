import { createListService } from "@acme/api/helper/list-service";
import { item } from "@acme/db/schema/item";
import {
	listParamsSchema,
	listResponseSchema,
} from "@acme/types/schemas/common.schema";
import {
	itemCreateSchema,
	itemDetailSchema,
	itemGetByIdSchema,
	itemListSchema,
	itemMapMarkerSchema,
	itemUpdateSchema,
} from "@acme/types/schemas/item.schema";
import { desc, eq } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import z from "zod";
import { protectedProcedure, router } from "../index";
import {
	createItem,
	getItemById,
	listItemsForMap,
	updateItem,
} from "../services/item-service";

const filterableColumns = {
	name: item.name,
	address: item.address,
	status: item.status,
} satisfies Record<string, PgColumn>;

const sortableColumns = {
	name: item.name,
	address: item.address,
	status: item.status,
	createdAt: item.createdAt,
} satisfies Record<string, PgColumn>;

const listItems = createListService({
	table: item,
	filterableColumns,
	sortableColumns,
	defaultOrderBy: [desc(item.createdAt)],
	searchColumns: [item.name, item.description],
	where: eq(item.deleted, false),
});

export const itemRouter = router({
	list: protectedProcedure
		.input(listParamsSchema)
		.output(listResponseSchema(itemListSchema))
		.query(async ({ input }) => listItems(input)),

	getById: protectedProcedure
		.input(itemGetByIdSchema)
		.output(itemDetailSchema)
		.query(async ({ input }) => getItemById(input.id)),

	listForMap: protectedProcedure
		.output(z.array(itemMapMarkerSchema))
		.query(() => listItemsForMap()),

	create: protectedProcedure
		.input(itemCreateSchema)
		.output(z.object({ id: z.string() }))
		.mutation(async ({ input }) => createItem(input)),

	update: protectedProcedure
		.input(itemUpdateSchema)
		.output(z.object({ id: z.string() }))
		.mutation(async ({ input }) => updateItem(input)),
});
export type ItemRouter = typeof itemRouter;
