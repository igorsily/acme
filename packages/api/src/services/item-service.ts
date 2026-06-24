import { db } from "@acme/db";
import { item } from "@acme/db/schema/item";
import type {
	ItemCreateInput,
	ItemDetail,
	ItemFormValues,
	ItemUpdateInput,
} from "@acme/types/schemas/item.schema";
import { slugify } from "@acme/types/utils/slugify";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

function mapItemRow(row: typeof item.$inferSelect): ItemDetail {
	const coordinate = row.coordinate;

	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		description: row.description ?? undefined,
		address: row.address ?? undefined,
		lat: coordinate?.y,
		lng: coordinate?.x,
		status: row.status,
	};
}

function buildItemValues(
	input: ItemFormValues,
	slug: string,
	options: { mode: "create" | "update" }
) {
	const baseValues = {
		name: input.name,
		description: input.description ?? null,
		slug,
		address: input.address ?? null,
		status: input.status,
	};

	if (input.lat != null && input.lng != null) {
		return {
			...baseValues,
			coordinate: { x: input.lng, y: input.lat },
		};
	}

	if (options.mode === "create") {
		return {
			...baseValues,
			coordinate: null,
		};
	}

	return baseValues;
}

export async function getItemById(id: string): Promise<ItemDetail> {
	const [row] = await db
		.select()
		.from(item)
		.where(and(eq(item.id, id), eq(item.deleted, false)))
		.limit(1);

	if (!row) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Item não encontrado",
		});
	}

	return mapItemRow(row);
}

export async function createItem(
	input: ItemCreateInput
): Promise<{ id: string }> {
	const slug = slugify(input.name);

	if (!slug) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Nome inválido para gerar slug",
		});
	}

	const values = buildItemValues(input, slug, { mode: "create" });

	const [created] = await db
		.insert(item)
		.values(values)
		.returning({ id: item.id });

	if (!created) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Erro ao criar item",
		});
	}

	return { id: created.id };
}

export async function updateItem(
	input: ItemUpdateInput
): Promise<{ id: string }> {
	await getItemById(input.id);
	const slug = slugify(input.name);

	if (!slug) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Nome inválido para gerar slug",
		});
	}

	const values = buildItemValues(input, slug, { mode: "update" });

	await db.update(item).set(values).where(eq(item.id, input.id));

	return { id: input.id };
}
