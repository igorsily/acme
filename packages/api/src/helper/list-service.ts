import {
	applyColumnFilters,
	buildSearchCondition,
	type ColumnFilterConditionFactory,
	parseSort,
} from "@acme/api/helper/format-search";
import { db } from "@acme/db";
import type { ListParams } from "@acme/types/schemas/common.schema";
import { and, count, type InferSelectModel, type SQL } from "drizzle-orm";
import type { AnyPgTable, PgColumn } from "drizzle-orm/pg-core";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

type DefaultOrderBy = readonly [SQL, ...SQL[]];

export type ListResponse<T> = {
	data: T[];
	pageCount: number;
	total: number;
};

export type ListServiceConfig<TTable extends AnyPgTable> = {
	table: TTable;
	filterableColumns: Record<string, PgColumn>;
	sortableColumns: Record<string, PgColumn>;
	defaultOrderBy: DefaultOrderBy;
	searchColumns: readonly PgColumn[];
	customFilterConditions?: Record<string, ColumnFilterConditionFactory>;
	where?: SQL;
};

export function createListService<TTable extends AnyPgTable>(
	config: ListServiceConfig<TTable>
): (params: ListParams) => Promise<ListResponse<InferSelectModel<TTable>>> {
	return async (params: ListParams) => {
		const page = Math.max(params.page ?? DEFAULT_PAGE, DEFAULT_PAGE);
		const limit = Math.min(
			Math.max(params.limit ?? DEFAULT_LIMIT, 1),
			MAX_LIMIT
		);
		const offset = (page - 1) * limit;
		const searchTerm = params.search?.trim();

		const searchCondition = buildSearchCondition(
			searchTerm,
			config.searchColumns
		);
		const filterConditions = applyColumnFilters(
			params.filters,
			config.filterableColumns,
			config.customFilterConditions
		);

		const whereClause = and(config.where, searchCondition, ...filterConditions);

		const orderBy = params.sort
			? parseSort(params.sort, config.sortableColumns, config.defaultOrderBy[0])
			: [...config.defaultOrderBy];
		const table = config.table as never;
		const rowsQuery = db
			.select()
			.from(table)
			.where(whereClause)
			.orderBy(...orderBy)
			.limit(limit)
			.offset(offset);
		const totalQuery = db
			.select({ count: count() })
			.from(table)
			.where(whereClause) as Promise<Array<{ count: number }>>;

		const { sql, params: rowsParams } = rowsQuery.toSQL();

		console.log(sql); // Output: select "id", "name" from "users" where "id" = $1
		console.log(rowsParams); // Output: [1]

		const [rows, [totalRow]] = await Promise.all([rowsQuery, totalQuery]);

		const total = Number(totalRow?.count ?? 0);

		return {
			data: rows,
			pageCount: Math.ceil(total / limit),
			total,
		};
	};
}
