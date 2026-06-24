"use client";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
} from "@acme/ui/components/context-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@acme/ui/components/table";
import { cn } from "@acme/ui/lib/utils";
import {
	flexRender,
	type Row,
	type Table as TanStackTable,
} from "@tanstack/react-table";
import type * as React from "react";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

const INTERACTIVE_ROW_SELECTOR =
	'button, a, input, textarea, select, [type="checkbox"], [role="menu"], [role="dialog"], [role="button"]';

function isInteractiveRowTarget(target: EventTarget | null) {
	return Boolean(
		target instanceof HTMLElement && target.closest(INTERACTIVE_ROW_SELECTOR)
	);
}

function DataTableRoot({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={cn("space-y-4", className)}>{children}</div>;
}

function TableBodyContent<TData>({
	rows,
	colSpan,
	isLoading,
	isEmpty,
	isError,
	onRowClick,
	rowContextMenu,
}: {
	rows: Row<TData>[];
	colSpan: number;
	isLoading: boolean;
	isEmpty: boolean;
	isError: boolean;
	onRowClick?: (row: TData) => void;
	rowContextMenu?: (row: TData) => React.ReactNode;
}) {
	if (isLoading) {
		return (
			<TableRow>
				<TableCell className="h-24 text-center" colSpan={colSpan}>
					Carregando...
				</TableCell>
			</TableRow>
		);
	}

	if (isError) {
		return (
			<TableRow>
				<TableCell className="h-24 text-center" colSpan={colSpan}>
					Erro ao carregar os dados.
				</TableCell>
			</TableRow>
		);
	}

	if (isEmpty) {
		return (
			<TableRow>
				<TableCell className="h-24 text-center" colSpan={colSpan}>
					Nenhum resultado encontrado.
				</TableCell>
			</TableRow>
		);
	}

	const handleRowClick = (e: React.MouseEvent, row: TData) => {
		if (!onRowClick || isInteractiveRowTarget(e.target)) {
			return;
		}

		onRowClick(row);
	};

	const handleRowKeyDown = (e: React.KeyboardEvent, row: TData) => {
		if (!onRowClick) {
			return;
		}

		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onRowClick(row);
		}
	};

	return rows.map((row) => {
		const rowNode = (
			<TableRow
				className={cn(onRowClick && "cursor-pointer")}
				data-state={row.getIsSelected() && "selected"}
				key={row.id}
				onClick={(e) => handleRowClick(e, row.original)}
				onKeyDown={(e) => handleRowKeyDown(e, row.original)}
				tabIndex={onRowClick ? 0 : undefined}
			>
				{row.getVisibleCells().map((cell) => (
					<TableCell key={cell.id}>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</TableCell>
				))}
			</TableRow>
		);

		if (rowContextMenu) {
			return (
				<ContextMenu key={row.id}>
					<ContextMenuTrigger render={rowNode} />
					<ContextMenuContent>
						{rowContextMenu(row.original)}
					</ContextMenuContent>
				</ContextMenu>
			);
		}

		return rowNode;
	});
}

function DataTableContent<TData>({
	table,
	rows,
	isLoading,
	isEmpty,
	isError,
	onRowClick,
	rowContextMenu,
}: {
	table: TanStackTable<TData>;
	rows?: Row<TData>[];
	isLoading?: boolean;
	isEmpty?: boolean;
	isError?: boolean;
	onRowClick?: (row: TData) => void;
	rowContextMenu?: (row: TData) => React.ReactNode;
}) {
	const meta = table.options.meta;
	const loading = isLoading ?? meta?.isLoading ?? false;
	const empty = isEmpty ?? meta?.isEmpty ?? false;
	const error = isError ?? meta?.isError ?? false;
	const colSpan = table.getAllColumns().length;
	const visibleRows = rows ?? table.getRowModel().rows;

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead colSpan={header.colSpan} key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					<TableBodyContent
						colSpan={colSpan}
						isEmpty={empty}
						isError={error}
						isLoading={loading}
						onRowClick={onRowClick}
						rowContextMenu={rowContextMenu}
						rows={visibleRows}
					/>
				</TableBody>
			</Table>
		</div>
	);
}

export const DataTable = Object.assign(DataTableRoot, {
	Toolbar: DataTableToolbar,
	Content: DataTableContent,
	Pagination: DataTablePagination,
});
