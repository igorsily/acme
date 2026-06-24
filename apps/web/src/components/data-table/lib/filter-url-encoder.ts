import type { ColumnFilterItem } from "@acme/types/schemas/common.schema";

const OPERATOR_CODES = {
	equals: "eq",
	notEquals: "neq",
	contains: "ct",
	startsWith: "sw",
	endsWith: "ew",
	gt: "gt",
	gte: "ge",
	lt: "lt",
	lte: "le",
	between: "bt",
	before: "bf",
	after: "af",
	in: "in",
	notIn: "ni",
} as const;

const REVERSE_OPERATOR_CODES: Record<string, string> = Object.fromEntries(
	Object.entries(OPERATOR_CODES).map(([key, value]) => [value, key])
);

const FILTER_PREFIX = "f_";

function tryParseNumber(value: string): number | string {
	const parsed = Number(value);
	return Number.isNaN(parsed) ? value : parsed;
}

/**
 * Encode ColumnFilterItem[] into a Record of URL params.
 * Example: [{ field: "status", operator: "equals", value: "active" }]
 *   → { f_status: "eq:active" }
 *
 * Returns null for params that should be removed (empty filters).
 */
export function encodeFilters(
	filters: ColumnFilterItem[]
): Record<string, string | null> {
	const result: Record<string, string | null> = {};

	// First, collect all existing f_* keys to clear them
	// (caller will merge this with existing params)

	for (const filter of filters) {
		const code = OPERATOR_CODES[filter.operator as keyof typeof OPERATOR_CODES];
		if (!code) {
			continue;
		}

		const key = `${FILTER_PREFIX}${filter.field}`;

		if (filter.value !== undefined && filter.value !== "") {
			let encodedValue: string;

			if (Array.isArray(filter.value)) {
				encodedValue = filter.value.join(",");
			} else {
				encodedValue = String(filter.value);
			}

			result[key] = `${code}:${encodedValue}`;
		}
	}

	return result;
}

/**
 * Parse the raw value string based on operator type.
 */
function parseFilterValue(
	operator: string,
	rawValue: string
): string | number | boolean | string[] | number[] | undefined {
	if (operator === "between") {
		const parts = rawValue.split(",");
		if (parts.length !== 2) {
			return;
		}
		const num0 = Number(parts[0]);
		const num1 = Number(parts[1]);
		if (!(Number.isNaN(num0) || Number.isNaN(num1))) {
			return [num0, num1];
		}
		return [parts[0], parts[1]];
	}

	if (operator === "in" || operator === "notIn") {
		return rawValue.split(",");
	}

	return tryParseNumber(rawValue);
}

/**
 * Decode a single filter entry from a URL param key-value pair.
 * Returns null if the entry is invalid or should be skipped.
 */
function decodeFilterEntry(
	key: string,
	value: string
): ColumnFilterItem | null {
	if (!(key.startsWith(FILTER_PREFIX) && value)) {
		return null;
	}

	const field = key.slice(FILTER_PREFIX.length);
	const colonIndex = value.indexOf(":");
	if (colonIndex === -1) {
		return null;
	}

	const code = value.slice(0, colonIndex);
	const rawValue = value.slice(colonIndex + 1);
	const operator = REVERSE_OPERATOR_CODES[code];

	if (!operator) {
		return null;
	}

	return {
		field,
		operator,
		value: parseFilterValue(operator, rawValue),
	};
}

/**
 * Decode URL search params into ColumnFilterItem[].
 * Reads all keys starting with "f_" and parses their values.
 *
 * Examples:
 *   "eq:active" → { field: "status", operator: "equals", value: "active" }
 *   "bt:18,65" → { field: "idade", operator: "between", value: [18, 65] }
 *   "in:active,inactive" → { field: "status", operator: "in", value: ["active", "inactive"] }
 *   "bf:2024-01-01" → { field: "createdAt", operator: "before", value: "2024-01-01" }
 */
export function decodeFilters(
	searchParams: URLSearchParams | Record<string, string>
): ColumnFilterItem[] {
	const entries =
		searchParams instanceof URLSearchParams
			? Array.from(searchParams.entries())
			: Object.entries(searchParams);

	return entries
		.map(([key, value]) => decodeFilterEntry(key, value))
		.filter((filter): filter is ColumnFilterItem => filter !== null);
}

/**
 * Build a new URLSearchParams with updated f_* params.
 * Removes all existing f_* keys and adds the new ones.
 * Preserves all other query params.
 */
export function buildFilterSearchParams(
	currentParams: URLSearchParams,
	encodedFilters: Record<string, string | null>
): URLSearchParams {
	const newParams = new URLSearchParams(currentParams.toString());

	// Remove all existing f_* keys
	for (const key of [...newParams.keys()]) {
		if (key.startsWith(FILTER_PREFIX)) {
			newParams.delete(key);
		}
	}

	// Add new f_* params (skip null values — they represent removal)
	for (const [key, value] of Object.entries(encodedFilters)) {
		if (value !== null) {
			newParams.set(key, value);
		}
	}

	return newParams;
}
