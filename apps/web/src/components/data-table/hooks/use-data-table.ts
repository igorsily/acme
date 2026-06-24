"use client";

import {
	type ColumnDef,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	type PaginationState,
	type Row,
	type RowData,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useTableSearchParams } from "@/components/data-table/lib/table-state-parsers";
import { useDataTableFilters } from "./use-data-table-filters";

declare module "@tanstack/react-table" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// biome-ignore lint/style/useConsistentTypeDefinitions: required for module augmentation
	interface TableMeta<TData extends RowData> {
		isEmpty: boolean;
		isError: boolean;
		isLoading: boolean;
	}
}

export type QueryState<TData> = {
	data: TData[] | undefined;
	error: unknown;
	isError: boolean;
	isFetching?: boolean;
	isLoading: boolean;
};

export type UseDataTableProps<TData, TValue> = {
	columns: ColumnDef<TData, TValue>[];
	pageCount?: number;
	query: QueryState<TData>;
};

export function useDataTable<TData, TValue>({
	columns,
	pageCount = -1,
	query,
}: UseDataTableProps<TData, TValue>) {
	const [urlState, setUrlState] = useTableSearchParams();
	const { columnFilters, onColumnFiltersChange } = useDataTableFilters();
	const data = query.data ?? [];

	const pagination: PaginationState = {
		pageIndex: urlState.pageIndex,
		pageSize: urlState.pageSize,
	};

	const sorting: SortingState = urlState.sort;

	const isLoading = query.isLoading && !query.data;
	const isError = query.isError;
	const isEmpty = !(isLoading || isError) && data.length === 0;

	const table = useReactTable({
		columns,
		data,
		getCoreRowModel: getCoreRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		enableMultiSort: true,
		manualPagination: true,
		manualFiltering: true,
		manualSorting: true,
		meta: { isLoading, isEmpty, isError },
		onGlobalFilterChange: (updaterOrValue) => {
			const next =
				typeof updaterOrValue === "function"
					? updaterOrValue(urlState.search)
					: updaterOrValue;

			setUrlState({ pageIndex: 0, search: next || null });
		},
		onColumnFiltersChange,
		onPaginationChange: (updaterOrValue) => {
			const next =
				typeof updaterOrValue === "function"
					? updaterOrValue(pagination)
					: updaterOrValue;
			const pageSizeChanged = next.pageSize !== pagination.pageSize;

			setUrlState({
				pageIndex: pageSizeChanged ? 0 : next.pageIndex,
				pageSize: next.pageSize,
			});
		},
		onSortingChange: (updaterOrValue) => {
			const next =
				typeof updaterOrValue === "function"
					? updaterOrValue(sorting)
					: updaterOrValue;

			setUrlState({ pageIndex: 0, sort: next });
		},
		pageCount,
		state: {
			columnFilters,
			globalFilter: urlState.search,
			pagination,
			sorting,
		},
	});
	const rows: Row<TData>[] = table.getRowModel().rows;

	return {
		table,
		rows,
		isFetching: query.isFetching ?? false,
		error: query.error,
		isLoading,
		isEmpty,
		isError,
		pageIndex: pagination.pageIndex,
		pageSize: pagination.pageSize,
	};
}
