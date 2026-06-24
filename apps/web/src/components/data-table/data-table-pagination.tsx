"use client";

import { Button } from "@acme/ui/components/button";
import { Skeleton } from "@acme/ui/components/skeleton";
import type { Table } from "@tanstack/react-table";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";

type DataTablePaginationProps<TData> = {
	isLoading?: boolean;
	pageCount?: number;
	pageIndex?: number;
	pageSize?: number;
	table: Table<TData>;
};

export function DataTablePagination<TData>({
	table,
	isLoading,
	pageCount: pageCountProp,
	pageIndex: pageIndexProp,
	pageSize: pageSizeProp,
}: DataTablePaginationProps<TData>) {
	const pageCount = pageCountProp ?? table.getPageCount();
	const { pagination } = table.getState();
	const pageIndex = pageIndexProp ?? pagination.pageIndex;
	const pageSize = pageSizeProp ?? pagination.pageSize;
	const canPreviousPage = pageIndex > 0;
	const canNextPage = pageIndex < pageCount - 1;

	if (isLoading) {
		return (
			<div className="flex items-center justify-between px-2">
				<Skeleton className="h-8 w-50" />
				<div className="flex items-center space-x-6 lg:space-x-8">
					<Skeleton className="h-8 w-25" />
					<Skeleton className="h-8 w-50" />
				</div>
			</div>
		);
	}

	if (pageCount <= 0) {
		return null;
	}

	return (
		<div className="flex items-center justify-between px-2">
			<div className="flex-1" />
			<div className="flex items-center space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="font-medium text-sm">Linhas por página</p>
					<select
						className="h-8 w-[70px] rounded-md border bg-background px-2 text-sm"
						onChange={(e) => {
							table.setPageSize(Number(e.target.value));
						}}
						value={pageSize}
					>
						{[10, 20, 30, 40, 50].map((pageSize) => (
							<option key={pageSize} value={pageSize}>
								{pageSize}
							</option>
						))}
					</select>
				</div>
				<div className="flex items-center justify-center whitespace-nowrap font-medium text-sm">
					{`Página ${pageIndex + 1} de ${pageCount}`}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						className="hidden h-8 w-8 p-0 lg:flex"
						disabled={!canPreviousPage}
						onClick={() => table.setPageIndex(0)}
						variant="outline"
					>
						<span className="sr-only">Ir para primeira página</span>
						<ChevronsLeft className="h-4 w-4" />
					</Button>
					<Button
						className="h-8 w-8 p-0"
						disabled={!canPreviousPage}
						onClick={() => table.previousPage()}
						variant="outline"
					>
						<span className="sr-only">Página anterior</span>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						className="h-8 w-8 p-0"
						disabled={!canNextPage}
						onClick={() => table.nextPage()}
						variant="outline"
					>
						<span className="sr-only">Próxima página</span>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<Button
						className="hidden h-8 w-8 p-0 lg:flex"
						disabled={!canNextPage}
						onClick={() => table.setPageIndex(pageCount - 1)}
						variant="outline"
					>
						<span className="sr-only">Ir para última página</span>
						<ChevronsRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
