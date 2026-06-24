"use client";

import { Button } from "@acme/ui/components/button";
import { Input } from "@acme/ui/components/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@acme/ui/components/select";
import { cn } from "@acme/ui/lib/utils";
import type { Column, ColumnFiltersState } from "@tanstack/react-table";
import { Filter, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDataTableFilters } from "./hooks/use-data-table-filters";
import {
	type FilterType,
	NEEDS_TWO_VALUES,
	OPERATORS_BY_FILTER_TYPE,
} from "./lib/filter-operators";

type ColumnMeta = {
	filterOptions?: { label: string; value: string }[];
	filterType?: FilterType;
};

type DataTableColumnFilterMenuProps<TData, TValue> = {
	column: Column<TData, TValue>;
	title: string;
};

const BOOLEAN_OPTIONS = [
	{ label: "Sim", value: "true" },
	{ label: "Não", value: "false" },
];

const POPOVER_WIDTH = 256;
const POPOVER_GAP = 8;
const VIEWPORT_PADDING = 16;

type PopoverPosition = {
	left: number;
	top: number;
};

function getOptionLabel(
	options: { label: string; value: string }[],
	value: string
): string | undefined {
	return options.find((option) => option.value === value)?.label;
}

function OptionsList({
	options,
}: {
	options: { label: string; value: string }[];
}) {
	return options.map((option) => (
		<SelectItem key={option.value} value={option.value}>
			{option.label}
		</SelectItem>
	));
}

function getInputType(filterType: string): string {
	if (filterType === "number") {
		return "number";
	}
	if (filterType === "date") {
		return "date";
	}
	return "text";
}

function getSinglePlaceholder(filterType: string): string {
	if (filterType === "date") {
		return "Data...";
	}
	if (filterType === "number") {
		return "Valor...";
	}
	return "Valor...";
}

function getFirstPlaceholder(filterType: string): string {
	if (filterType === "date") {
		return "Data início";
	}
	if (filterType === "number") {
		return "Valor mínimo";
	}
	return "Valor...";
}

function getSecondPlaceholder(filterType: string): string {
	if (filterType === "date") {
		return "Data fim";
	}
	if (filterType === "number") {
		return "Valor máximo";
	}
	return "Valor...";
}

function isFilterValueObject(
	value: unknown
): value is { operator: string; value: unknown } {
	return (
		typeof value === "object" &&
		value !== null &&
		"operator" in value &&
		"value" in value
	);
}

function isSelectPortalTarget(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		!!target.closest('[data-slot="select-content"], [data-slot="select-item"]')
	);
}

function calculatePopoverPosition(anchor: HTMLElement): PopoverPosition {
	const rect = anchor.getBoundingClientRect();
	const centeredLeft = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
	const maxLeft = Math.max(
		VIEWPORT_PADDING,
		window.innerWidth - POPOVER_WIDTH - VIEWPORT_PADDING
	);
	const left = Math.min(Math.max(centeredLeft, VIEWPORT_PADDING), maxLeft);

	return {
		left,
		top: rect.bottom + POPOVER_GAP,
	};
}

type InitStateParams = {
	currentFilter: ColumnFiltersState[number] | undefined;
	defaultOperator: string;
	setOperator: (v: string) => void;
	setValue: (v: string) => void;
	setValue2: (v: string) => void;
};

function initFilterState(params: InitStateParams) {
	const { currentFilter, defaultOperator, setOperator, setValue, setValue2 } =
		params;

	if (currentFilter && isFilterValueObject(currentFilter.value)) {
		const fv = currentFilter.value;
		setOperator(String(fv.operator ?? defaultOperator));
		const vals = fv.value;
		if (Array.isArray(vals)) {
			setValue(String(vals[0] ?? ""));
			setValue2(String(vals[1] ?? ""));
		} else {
			setValue(vals !== undefined && vals !== null ? String(vals) : "");
			setValue2("");
		}
	} else {
		setOperator(defaultOperator);
		setValue("");
		setValue2("");
	}
}

type BuildFilterParams = {
	columnId: string;
	filterType: string;
	operator: string;
	value: string;
	value2: string;
};

function buildUpdatedFilters(
	prev: ColumnFiltersState,
	params: BuildFilterParams
): ColumnFiltersState {
	const { columnId, operator, value, value2, filterType } = params;
	const filtered = prev.filter((f) => f.id !== columnId);

	if (NEEDS_TWO_VALUES.has(operator)) {
		const v1 = value.trim();
		const v2 = value2.trim();
		if (!(v1 && v2)) {
			return filtered;
		}
		if (filterType === "number") {
			const n1 = Number(v1);
			const n2 = Number(v2);
			if (Number.isNaN(n1) || Number.isNaN(n2)) {
				return filtered;
			}
		}
		const arrVal: unknown =
			filterType === "number" ? [Number(v1), Number(v2)] : [v1, v2];
		filtered.push({ id: columnId, value: { operator, value: arrVal } });
		return filtered;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return filtered;
	}

	let finalValue: unknown = trimmed;
	if (filterType === "number") {
		finalValue = Number(trimmed);
		if (Number.isNaN(finalValue as number)) {
			return filtered;
		}
	} else if (filterType === "boolean") {
		finalValue = trimmed === "true";
	}

	filtered.push({ id: columnId, value: { operator, value: finalValue } });
	return filtered;
}

function ValueInput({
	filterType,
	operator,
	value,
	value2,
	filterOptions,
	onValueChange,
	onValue2Change,
}: {
	filterType: string;
	operator: string;
	value: string;
	value2: string;
	filterOptions?: { label: string; value: string }[];
	onValueChange: (v: string) => void;
	onValue2Change: (v: string) => void;
}) {
	if (filterType === "boolean") {
		const selectedLabel = getOptionLabel(BOOLEAN_OPTIONS, value);

		return (
			<Select
				onValueChange={(nextValue) => {
					if (nextValue !== null) {
						onValueChange(nextValue);
					}
				}}
				value={value}
			>
				<SelectTrigger className="mt-2 h-8 w-full text-xs">
					<SelectValue placeholder="Selecionar...">{selectedLabel}</SelectValue>
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<OptionsList options={BOOLEAN_OPTIONS} />
					</SelectGroup>
				</SelectContent>
			</Select>
		);
	}

	if (filterType === "select" && filterOptions) {
		const selectedLabel = getOptionLabel(filterOptions, value);

		return (
			<Select
				onValueChange={(nextValue) => {
					if (nextValue !== null) {
						onValueChange(nextValue);
					}
				}}
				value={value}
			>
				<SelectTrigger className="mt-2 h-8 w-full text-xs">
					<SelectValue placeholder="Selecionar...">{selectedLabel}</SelectValue>
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<OptionsList options={filterOptions} />
					</SelectGroup>
				</SelectContent>
			</Select>
		);
	}

	const inputType = getInputType(filterType);
	const showTwoInputs = NEEDS_TWO_VALUES.has(operator);

	if (showTwoInputs) {
		return (
			<div className="mt-2 flex flex-col gap-1.5">
				<Input
					className="h-8 w-full text-xs"
					onChange={(e) => onValueChange(e.target.value)}
					placeholder={getFirstPlaceholder(filterType)}
					type={inputType}
					value={value}
				/>
				<Input
					className="h-8 w-full text-xs"
					onChange={(e) => onValue2Change(e.target.value)}
					placeholder={getSecondPlaceholder(filterType)}
					type={inputType}
					value={value2}
				/>
			</div>
		);
	}

	return (
		<Input
			className="mt-2 h-8 w-full text-xs"
			onChange={(e) => onValueChange(e.target.value)}
			placeholder={getSinglePlaceholder(filterType)}
			type={inputType}
			value={value}
		/>
	);
}

export function DataTableColumnFilterMenu<TData, TValue>({
	column,
	title,
}: DataTableColumnFilterMenuProps<TData, TValue>) {
	const meta = column.columnDef.meta as ColumnMeta | undefined;
	const filterType = meta?.filterType ?? "text";
	const operators =
		OPERATORS_BY_FILTER_TYPE[filterType] ?? OPERATORS_BY_FILTER_TYPE.text;
	const defaultOperator = operators[0]?.value ?? "contains";

	const { columnFilters, onColumnFiltersChange } = useDataTableFilters();
	const currentFilter = columnFilters.find((f) => f.id === column.id);

	const [open, setOpen] = useState(false);
	const [operator, setOperator] = useState(defaultOperator);
	const [value, setValue] = useState<string>("");
	const [value2, setValue2] = useState<string>("");
	const [popoverPosition, setPopoverPosition] =
		useState<PopoverPosition | null>(null);

	const containerRef = useRef<HTMLDivElement>(null);

	const updatePopoverPosition = useCallback(() => {
		if (containerRef.current) {
			setPopoverPosition(calculatePopoverPosition(containerRef.current));
		}
	}, []);

	// Initialize local state from current filter when opening
	useEffect(() => {
		if (open) {
			updatePopoverPosition();
			initFilterState({
				currentFilter,
				defaultOperator,
				setOperator,
				setValue,
				setValue2,
			});
		}
	}, [open, currentFilter, defaultOperator, updatePopoverPosition]);

	useEffect(() => {
		if (!open) {
			return;
		}

		window.addEventListener("resize", updatePopoverPosition);
		window.addEventListener("scroll", updatePopoverPosition, true);

		return () => {
			window.removeEventListener("resize", updatePopoverPosition);
			window.removeEventListener("scroll", updatePopoverPosition, true);
		};
	}, [open, updatePopoverPosition]);

	// Click outside closes popover
	useEffect(() => {
		if (!open) {
			return;
		}

		const handleClick = (e: MouseEvent) => {
			if (isSelectPortalTarget(e.target)) {
				return;
			}

			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	// Escape closes popover
	useEffect(() => {
		if (!open) {
			return;
		}

		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setOpen(false);
			}
		};

		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [open]);

	const handleApply = useCallback(() => {
		onColumnFiltersChange((prev) =>
			buildUpdatedFilters(prev, {
				columnId: column.id,
				operator,
				value,
				value2,
				filterType,
			})
		);
		setOpen(false);
	}, [onColumnFiltersChange, column.id, operator, value, value2, filterType]);

	const handleClear = useCallback(() => {
		onColumnFiltersChange((prev) => prev.filter((f) => f.id !== column.id));
		setOpen(false);
	}, [onColumnFiltersChange, column.id]);

	const handleCancel = useCallback(() => {
		setOpen(false);
	}, []);

	const isFilterActive = !!currentFilter;
	const selectedOperatorLabel = getOptionLabel(operators, operator);

	const toggleOpen = useCallback(() => {
		setOpen((prev) => {
			if (prev) {
				return false;
			}

			updatePopoverPosition();
			return true;
		});
	}, [updatePopoverPosition]);

	return (
		<div className="inline-flex" ref={containerRef}>
			<Button
				aria-label={`Filtrar ${title}`}
				className="h-6 w-6 shrink-0"
				onClick={toggleOpen}
				type="button"
				variant="ghost"
			>
				<Filter
					aria-hidden="true"
					className={cn("h-3.5 w-3.5", isFilterActive && "text-primary")}
				/>
			</Button>

			{open && popoverPosition && (
				<div
					className="fixed z-50 w-64 rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
					style={{
						left: popoverPosition.left,
						top: popoverPosition.top,
					}}
				>
					<div className="mb-2 font-medium text-sm">Filtrar {title}</div>

					{/* Operator selector */}
					<Select
						onValueChange={(nextOperator) => {
							if (nextOperator === null) {
								return;
							}
							setOperator(nextOperator);
							setValue("");
							setValue2("");
						}}
						value={operator}
					>
						<SelectTrigger className="h-8 w-full text-xs">
							<SelectValue>{selectedOperatorLabel}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<OptionsList options={operators} />
							</SelectGroup>
						</SelectContent>
					</Select>

					{/* Value input */}
					<ValueInput
						filterOptions={meta?.filterOptions}
						filterType={filterType}
						onValue2Change={setValue2}
						onValueChange={setValue}
						operator={operator}
						value={value}
						value2={value2}
					/>

					{/* Action buttons */}
					<div className="mt-3 flex items-center justify-between border-t pt-2">
						<Button
							disabled={!isFilterActive}
							onClick={handleClear}
							size="sm"
							variant="ghost"
						>
							<X className="mr-1 h-3 w-3" />
							Limpar
						</Button>
						<div className="flex gap-1">
							<Button onClick={handleCancel} size="sm" variant="ghost">
								Cancelar
							</Button>
							<Button onClick={handleApply} size="sm">
								OK
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
