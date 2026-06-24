import {
	booleanFilterOperators,
	dateFilterOperators,
	numberFilterOperators,
	selectFilterOperators,
	textFilterOperators,
} from "@acme/types/schemas/common.schema";

const OPERATOR_LABELS: Record<string, string> = {
	contains: "Contém",
	startsWith: "Começa com",
	endsWith: "Termina com",
	equals: "É igual a",
	notEquals: "Não é igual a",
	gt: "Maior que",
	gte: "Maior ou igual a",
	lt: "Menor que",
	lte: "Menor ou igual a",
	between: "Entre",
	before: "Antes de",
	after: "Depois de",
	in: "Está em",
	notIn: "Não está em",
};

function toOperatorOptions(operators: readonly string[]) {
	return operators.map((value) => ({
		value,
		label: OPERATOR_LABELS[value] ?? value,
	}));
}

export const OPERATORS_BY_FILTER_TYPE = {
	text: toOperatorOptions(textFilterOperators),
	number: toOperatorOptions(numberFilterOperators),
	date: toOperatorOptions(dateFilterOperators),
	select: toOperatorOptions(selectFilterOperators),
	boolean: toOperatorOptions(booleanFilterOperators),
} as const;

export type FilterType = keyof typeof OPERATORS_BY_FILTER_TYPE;

export const NEEDS_TWO_VALUES = new Set(["between"]);
