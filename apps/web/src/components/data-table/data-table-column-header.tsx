"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@acme/ui/components/dropdown-menu";
import { cn } from "@acme/ui/lib/utils";
import type { Column } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, ChevronsUpDown, X } from "lucide-react";
import { DataTableColumnFilterMenu } from "./data-table-column-filter-menu";

interface DataTableColumnHeaderProps<TData, TValue>
	extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>;
	title: string;
}

function getSortIcon(sorted: false | "asc" | "desc"): LucideIcon {
	if (sorted === "desc") {
		return ArrowDown;
	}
	if (sorted === "asc") {
		return ArrowUp;
	}
	return ChevronsUpDown;
}

export function DataTableColumnHeader<TData, TValue>({
	column,
	title,
	className,
}: DataTableColumnHeaderProps<TData, TValue>) {
	const hasFilterType = !!(
		column.columnDef.meta as Record<string, unknown> | undefined
	)?.filterType;

	if (!column.getCanSort()) {
		return (
			<div className={cn("flex items-center space-x-1", className)}>
				<span>{title}</span>
				{hasFilterType && (
					<DataTableColumnFilterMenu column={column} title={title} />
				)}
			</div>
		);
	}

	const isSorted = column.getIsSorted();
	const SortIcon = getSortIcon(isSorted);
	const sortIndex = column.getSortIndex();

	return (
		<div className={cn("flex items-center space-x-1", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger
					className="-ml-3 inline-flex h-8 cursor-default items-center gap-1.5 rounded-md px-3 font-medium text-sm hover:bg-accent hover:text-accent-foreground data-[popup-open]:bg-accent"
					onClick={column.getToggleSortingHandler()}
				>
					<span>{title}</span>
					{sortIndex >= 0 && (
						<span className="flex h-4 w-4 items-center justify-center rounded bg-muted font-mono text-[10px] tabular-nums leading-none">
							{sortIndex + 1}
						</span>
					)}
					<SortIcon className="ml-2 h-4 w-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
						<ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Crescente
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
						<ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Decrescente
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						disabled={!isSorted}
						onClick={() => column.clearSorting()}
					>
						<X className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
						Remover
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{hasFilterType && (
				<DataTableColumnFilterMenu column={column} title={title} />
			)}
		</div>
	);
}
