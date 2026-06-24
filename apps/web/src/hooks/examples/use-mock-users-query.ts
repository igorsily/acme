"use client";

import type { ColumnFilterItem } from "@acme/types/schemas/common.schema";
import { useMemo } from "react";
import type { QueryState } from "@/components/data-table/hooks/use-data-table";
import { useTableSearchParams } from "@/components/data-table/lib/table-state-parsers";
import {
	MOCK_USERS,
	type MockUser,
} from "@/components/features/examples/mock-user-data";

type MockUsersQueryState = QueryState<MockUser> & {
	pageCount: number;
	total: number;
};

const SELECT_FIELDS = new Set(["role", "status", "department"]);
const NUMBER_FIELDS = new Set(["age"]);
const BOOLEAN_FIELDS = new Set(["banned"]);
const DATE_FIELDS = new Set(["createdAt"]);

function isEmptyValue(value: unknown): boolean {
	return value == null || value === "";
}

function normalizeText(value: unknown): string {
	if (value instanceof Date) {
		return value.toISOString();
	}

	return typeof value === "string" ? value : String(value ?? "");
}

function parseDate(value: unknown): Date | null {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}

	return null;
}

function getFieldValue(user: MockUser, field: string): unknown {
	switch (field) {
		case "id":
			return user.id;
		case "name":
			return user.name;
		case "email":
			return user.email;
		case "role":
			return user.role;
		case "status":
			return user.status;
		case "banned":
			return user.banned;
		case "department":
			return user.department;
		case "age":
			return user.age;
		case "createdAt":
			return user.createdAt;
		case "avatarUrl":
			return user.avatarUrl;
		default:
			return;
	}
}

function compareValues(left: unknown, right: unknown): number {
	if (left === right) {
		return 0;
	}

	if (left == null) {
		return 1;
	}

	if (right == null) {
		return -1;
	}

	if (left instanceof Date || right instanceof Date) {
		const leftDate = left instanceof Date ? left : parseDate(left);
		const rightDate = right instanceof Date ? right : parseDate(right);

		if (!(leftDate && rightDate)) {
			return 0;
		}

		return leftDate.getTime() - rightDate.getTime();
	}

	if (typeof left === "number" && typeof right === "number") {
		return left - right;
	}

	if (typeof left === "boolean" && typeof right === "boolean") {
		return Number(left) - Number(right);
	}

	return normalizeText(left).localeCompare(normalizeText(right), undefined, {
		numeric: true,
		sensitivity: "base",
	});
}

function matchesTextFilter(
	value: unknown,
	operator: string,
	filterValue: unknown
): boolean {
	const text = normalizeText(value).toLowerCase();
	const needle = normalizeText(filterValue).toLowerCase();

	switch (operator) {
		case "contains":
			return text.includes(needle);
		case "startsWith":
			return text.startsWith(needle);
		case "endsWith":
			return text.endsWith(needle);
		case "equals":
			return text === needle;
		case "notEquals":
			return text !== needle;
		case "isEmpty":
			return isEmptyValue(value);
		case "isNotEmpty":
			return !isEmptyValue(value);
		default:
			return true;
	}
}

function matchesSelectFilter(
	value: unknown,
	operator: string,
	filterValue: unknown
): boolean {
	const text = normalizeText(value);
	const expected = normalizeText(filterValue);

	switch (operator) {
		case "equals":
			return text === expected;
		case "notEquals":
			return text !== expected;
		case "isEmpty":
			return isEmptyValue(value);
		case "isNotEmpty":
			return !isEmptyValue(value);
		default:
			return true;
	}
}

function matchesNumberFilter(
	value: unknown,
	operator: string,
	filterValue: unknown
): boolean {
	if (typeof value !== "number") {
		return false;
	}

	switch (operator) {
		case "equals":
			return typeof filterValue === "number"
				? value === filterValue
				: Number(filterValue) === value;
		case "gt":
			return typeof filterValue === "number"
				? value > filterValue
				: value > Number(filterValue);
		case "gte":
			return typeof filterValue === "number"
				? value >= filterValue
				: value >= Number(filterValue);
		case "lt":
			return typeof filterValue === "number"
				? value < filterValue
				: value < Number(filterValue);
		case "lte":
			return typeof filterValue === "number"
				? value <= filterValue
				: value <= Number(filterValue);
		case "between": {
			if (!Array.isArray(filterValue) || filterValue.length < 2) {
				return true;
			}

			const [minValue, maxValue] = filterValue;
			const min = Number(minValue);
			const max = Number(maxValue);

			if (Number.isNaN(min) || Number.isNaN(max)) {
				return true;
			}

			return value >= min && value <= max;
		}
		case "isEmpty":
			return isEmptyValue(value);
		case "isNotEmpty":
			return !isEmptyValue(value);
		default:
			return true;
	}
}

function matchesBooleanFilter(
	value: unknown,
	operator: string,
	filterValue: unknown
): boolean {
	if (typeof value !== "boolean") {
		return false;
	}

	if (operator === "isEmpty") {
		return isEmptyValue(value);
	}

	if (operator === "isNotEmpty") {
		return !isEmptyValue(value);
	}

	const expected = filterValue === true || filterValue === "true";
	return value === expected;
}

function matchesDateFilter(
	value: unknown,
	operator: string,
	filterValue: unknown
): boolean {
	if (!(value instanceof Date)) {
		return false;
	}

	if (operator === "isEmpty") {
		return isEmptyValue(value);
	}

	if (operator === "isNotEmpty") {
		return !isEmptyValue(value);
	}

	const expected = parseDate(filterValue);
	if (!expected) {
		return true;
	}

	switch (operator) {
		case "equals":
			return (
				value.toISOString().slice(0, 10) === expected.toISOString().slice(0, 10)
			);
		case "before":
			return value < expected;
		case "after":
			return value > expected;
		default:
			return true;
	}
}

function applyFilter(user: MockUser, filter: ColumnFilterItem): boolean {
	const value = getFieldValue(user, filter.field);

	if (SELECT_FIELDS.has(filter.field)) {
		return matchesSelectFilter(value, filter.operator, filter.value);
	}

	if (NUMBER_FIELDS.has(filter.field)) {
		return matchesNumberFilter(value, filter.operator, filter.value);
	}

	if (BOOLEAN_FIELDS.has(filter.field)) {
		return matchesBooleanFilter(value, filter.operator, filter.value);
	}

	if (DATE_FIELDS.has(filter.field)) {
		return matchesDateFilter(value, filter.operator, filter.value);
	}

	return matchesTextFilter(value, filter.operator, filter.value);
}

export function useMockUsersQuery(): MockUsersQueryState {
	const [urlState] = useTableSearchParams();
	const { filters, pageIndex, pageSize, search, sort } = urlState;

	return useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const filteredUsers = [...MOCK_USERS]
			.filter((user) => {
				if (!normalizedSearch) {
					return true;
				}

				return (
					user.name.toLowerCase().includes(normalizedSearch) ||
					user.email.toLowerCase().includes(normalizedSearch)
				);
			})
			.filter((user) => filters.every((filter) => applyFilter(user, filter)))
			.sort((left, right) => {
				for (const { id, desc } of sort) {
					const comparison = compareValues(
						getFieldValue(left, id),
						getFieldValue(right, id)
					);

					if (comparison !== 0) {
						return desc ? -comparison : comparison;
					}
				}

				return 0;
			});

		const total = filteredUsers.length;
		const pageCount = Math.ceil(total / pageSize);
		const start = pageIndex * pageSize;
		const pageData = filteredUsers.slice(start, start + pageSize);

		return {
			data: pageData,
			error: null,
			isError: false,
			isFetching: false,
			isLoading: false,
			pageCount,
			total,
		};
	}, [filters, pageIndex, pageSize, search, sort]);
}
