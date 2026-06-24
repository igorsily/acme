import { z } from "zod";

// Operadores suportados por tipo de filtro
export const textFilterOperators = [
	"contains",
	"startsWith",
	"endsWith",
	"equals",
	"notEquals",
] as const;
export const numberFilterOperators = [
	"equals",
	"gt",
	"gte",
	"lt",
	"lte",
	"between",
] as const;
export const dateFilterOperators = [
	"equals",
	"before",
	"after",
	"between",
] as const;
export const selectFilterOperators = [
	"equals",
	"notEquals",
	"in",
	"notIn",
] as const;
export const booleanFilterOperators = ["equals"] as const;

// Schema para um item de filtro de coluna
export const columnFilterItemSchema = z.object({
	field: z.string().min(1, "Campo é obrigatório"),
	operator: z.string().min(1, "Operador é obrigatório"),
	value: z
		.union([
			z.string(),
			z.number(),
			z.boolean(),
			z.array(z.string()),
			z.array(z.number()),
		])
		.optional(),
});

export const listParamsSchema = z.object({
	page: z.number().int().positive().default(1),
	limit: z.number().int().positive().max(100).default(10),
	/**
	 * Sort accepts comma-separated `column.direction` pairs for multi-sort.
	 * @example "name.asc,status.desc"
	 */
	sort: z.string().optional(),
	search: z.string().optional(),
	filters: z.array(columnFilterItemSchema).optional(),
});

export const listResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
	z.object({
		data: itemSchema.array(),
		pageCount: z.number(),
		total: z.number(),
	});

export type ListParams = z.infer<typeof listParamsSchema>;
export type ColumnFilterItem = z.infer<typeof columnFilterItemSchema>;
export type TextFilterOperator = (typeof textFilterOperators)[number];
export type NumberFilterOperator = (typeof numberFilterOperators)[number];
export type DateFilterOperator = (typeof dateFilterOperators)[number];
export type SelectFilterOperator = (typeof selectFilterOperators)[number];
export type BooleanFilterOperator = (typeof booleanFilterOperators)[number];
