import type { ColumnFilterItem } from "@acme/types/schemas/common.schema";
import type { SortingState } from "@tanstack/react-table";
import { type UrlKeys, useQueryStates } from "nuqs";
import {
	createParser,
	parseAsInteger,
	parseAsJson,
	parseAsString,
} from "nuqs/server";

function isSortingStateEntry(value: unknown): value is SortingState[number] {
	return (
		typeof value === "object" &&
		value !== null &&
		"id" in value &&
		"desc" in value &&
		typeof value.id === "string" &&
		typeof value.desc === "boolean"
	);
}

export const parseAsSortingState = parseAsJson<SortingState>((value) => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isSortingStateEntry);
}).withDefault([]);

export const parseAsColumnFilterItems = parseAsJson<ColumnFilterItem[]>(
	(value) => {
		if (!Array.isArray(value)) {
			return [];
		}

		return value.filter(
			(item): item is ColumnFilterItem =>
				typeof item === "object" &&
				item !== null &&
				"field" in item &&
				typeof item.field === "string"
		);
	}
).withDefault([]);

export function serializeSortingStateForApi(
	value: SortingState
): string | undefined {
	if (value.length === 0) {
		return;
	}

	return value
		.map((sort) => `${sort.id}.${sort.desc ? "desc" : "asc"}`)
		.join(",");
}

export const tableQueryParsers = {
	pageIndex: createParser({
		parse: (value) => {
			const parsed = parseAsInteger.parse(value);
			return parsed === null ? null : Math.max(parsed - 1, 0);
		},
		serialize: (value) => String(value + 1),
	}).withDefault(0),
	pageSize: parseAsInteger.withDefault(10),
	search: parseAsString.withDefault(""),
	sort: parseAsSortingState,
	filters: parseAsColumnFilterItems,
};

export const paginationParsers = tableQueryParsers;

export const urlKeys: UrlKeys<typeof tableQueryParsers> = {
	pageIndex: "p",
	pageSize: "ps",
	search: "q",
	sort: "sort",
	filters: "f",
};

export const paginationUrlKeys = urlKeys;

export function useTableSearchParams() {
	const [urlState, setUrlState] = useQueryStates(tableQueryParsers, {
		urlKeys,
		history: "replace",
		scroll: false,
		shallow: true,
	});

	return [urlState, setUrlState] as const;
}
