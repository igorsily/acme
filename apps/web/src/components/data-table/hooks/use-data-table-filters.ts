"use client";

import type { ColumnFilterItem } from "@acme/types/schemas/common.schema";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useCallback } from "react";
import { useTableSearchParams } from "../lib/table-state-parsers";

type FilterValue = {
	operator?: string;
	value?: ColumnFilterItem["value"];
};

function isFilterValue(value: unknown): value is FilterValue {
	return typeof value === "object" && value !== null;
}

function toColumnFilterItem(
	filter: ColumnFiltersState[number]
): ColumnFilterItem {
	const value = isFilterValue(filter.value) ? filter.value.value : filter.value;
	const operator = isFilterValue(filter.value)
		? filter.value.operator
		: undefined;

	return {
		field: filter.id,
		operator: operator ?? "equals",
		value: value as ColumnFilterItem["value"],
	};
}

export function useDataTableFilters() {
	const [{ filters }, setUrlState] = useTableSearchParams();

	const setFilters = useCallback(
		(
			updater:
				| ColumnFilterItem[]
				| ((previousFilters: ColumnFilterItem[]) => ColumnFilterItem[])
		) => {
			const nextFilters =
				typeof updater === "function" ? updater(filters) : updater;

			setUrlState({ pageIndex: 0, filters: nextFilters });
		},
		[filters, setUrlState]
	);

	const columnFilters: ColumnFiltersState = filters.map((filter) => ({
		id: filter.field,
		value: { operator: filter.operator, value: filter.value },
	}));

	const onColumnFiltersChange = useCallback(
		(
			updaterOrValue:
				| ColumnFiltersState
				| ((previousFilters: ColumnFiltersState) => ColumnFiltersState)
		) => {
			const nextFilters =
				typeof updaterOrValue === "function"
					? updaterOrValue(columnFilters)
					: updaterOrValue;

			setFilters(nextFilters.map(toColumnFilterItem));
		},
		[columnFilters, setFilters]
	);

	return { filters, columnFilters, setFilters, onColumnFiltersChange };
}
