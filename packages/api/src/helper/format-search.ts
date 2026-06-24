import type { ListParams } from "@acme/types/schemas/common.schema";
import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	lt,
	lte,
	ne,
	notInArray,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

const ILIKE_WILDCARD_PATTERN = /[%_\\]/g;
const SEARCH_TOKEN_PATTERN = /\s+/;

export type ColumnFilterConditionFactory = (input: {
	column: PgColumn;
	operator: string;
	value: unknown;
}) => SQL | undefined;

/** Remove wildcards do ILIKE para evitar padrões acidentais na busca. */
export function sanitizeIlikeTerm(value: string): string {
	return value.replace(ILIKE_WILDCARD_PATTERN, "");
}

export function buildSearchCondition(
	searchTerm: string | undefined,
	columns: readonly PgColumn[]
): SQL | undefined {
	const normalizedTerm = searchTerm?.trim();

	if (!normalizedTerm) {
		return;
	}

	const tokens = normalizedTerm
		.split(SEARCH_TOKEN_PATTERN)
		.map(sanitizeIlikeTerm)
		.filter((token) => token.length > 0);

	if (tokens.length === 0) {
		return;
	}

	const tokenConditions = tokens.map((token) =>
		or(...columns.map((column) => ilike(column, `%${token}%`)))
	);

	return tokenConditions.length === 1
		? tokenConditions[0]
		: and(...tokenConditions);
}

export function applyColumnFilters(
	filters: ListParams["filters"],
	columns: Record<string, PgColumn>,
	customConditions: Record<string, ColumnFilterConditionFactory> = {}
): SQL[] {
	if (!filters) {
		return [];
	}

	return filters
		.map((filter) => {
			const column = columns[filter.field];
			if (!column) {
				return null;
			}

			const customCondition = customConditions[filter.field]?.({
				column,
				operator: filter.operator,
				value: filter.value,
			});

			if (customCondition) {
				return customCondition;
			}

			return createFilterCondition(column, filter.operator, filter.value);
		})
		.filter((condition): condition is SQL => Boolean(condition));
}

export function createCsvTokenFilterCondition({
	column,
	operator,
	value,
}: {
	column: PgColumn;
	operator: string;
	value: unknown;
}): SQL | undefined {
	if (typeof value !== "string") {
		return;
	}

	if (operator === "equals") {
		return sql`exists (select 1 from regexp_split_to_table(${column}, ',') as token(role) where btrim(token.role) = ${value})`;
	}

	if (operator === "notEquals") {
		return sql`not exists (select 1 from regexp_split_to_table(${column}, ',') as token(role) where btrim(token.role) = ${value})`;
	}

	return;
}

function createFilterCondition(
	column: PgColumn,
	operator: string,
	value: unknown
): SQL | undefined {
	switch (operator) {
		case "contains":
			return typeof value === "string"
				? ilike(column, `%${value}%`)
				: undefined;
		case "startsWith":
			return typeof value === "string" ? ilike(column, `${value}%`) : undefined;
		case "endsWith":
			return typeof value === "string" ? ilike(column, `%${value}`) : undefined;
		case "equals":
			return eq(column, value);
		case "notEquals":
			return ne(column, value);
		case "gt":
			return gt(column, value);
		case "gte":
			return gte(column, value);
		case "lt":
			return lt(column, value);
		case "lte":
			return lte(column, value);
		case "between":
			return Array.isArray(value) && value.length >= 2
				? and(gte(column, value[0]), lte(column, value[1]))
				: undefined;
		case "before":
			return lt(column, value);
		case "after":
			return gt(column, value);
		case "in":
			return Array.isArray(value) ? inArray(column, value) : undefined;
		case "notIn":
			return Array.isArray(value) ? notInArray(column, value) : undefined;
		default:
			return;
	}
}

export function parseSort(
	sort: string | undefined,
	columns: Record<string, PgColumn>,
	defaultOrderBy: SQL
): SQL[] {
	if (!sort) {
		return [defaultOrderBy];
	}

	const orderBy = sort
		.split(",")
		.map((entry) => {
			const [field, direction] = entry.split(".");
			const column = field ? columns[field] : undefined;

			if (!column) {
				return null;
			}

			return direction === "asc" ? asc(column) : desc(column);
		})
		.filter((item): item is SQL => Boolean(item));

	return orderBy.length > 0 ? orderBy : [defaultOrderBy];
}
