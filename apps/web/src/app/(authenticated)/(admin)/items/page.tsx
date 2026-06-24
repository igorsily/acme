"use client";

import type { ItemList } from "@acme/types/schemas/item.schema";
import { ContextMenuItem } from "@acme/ui/components/context-menu";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTable } from "@/components/data-table/hooks/use-data-table";
import { createItemColumns } from "@/components/features/items/item-columns";
import { useGoToMap } from "@/hooks/map/use-go-to-map";
import { useListQuery } from "@/hooks/use-list-query";
import { trpc } from "@/lib/trpc";

function ItemsTableContent() {
	const router = useRouter();
	const goToMap = useGoToMap();
	const [, setArchiveItem] = useState<ItemList | null>(null);

	const columns = useMemo(
		() =>
			createItemColumns({
				onArchive: setArchiveItem,
				onEdit: (entry) => router.push(`/items/${entry.id}`),
				onGoToMap: (entry) => goToMap({ itemId: entry.id }),
			}),
		[goToMap, router]
	);

	const query = useListQuery((input) => trpc.item.list.queryOptions(input));
	const { table, rows, isLoading, isEmpty, isError, pageIndex, pageSize } =
		useDataTable({
			columns,
			pageCount: query.pageCount,
			query,
		});

	return (
		<>
			<div>
				<h1 className="font-semibold text-2xl">Itens</h1>
				<p className="text-muted-foreground text-sm">
					Listagem de itens cadastrados no sistema.
				</p>
			</div>
			<DataTable.Toolbar
				actions={[
					{
						label: "Novo item",
						onClick: () => router.push("/items/novo"),
						icon: <Plus aria-hidden="true" />,
					},
				]}
				searchPlaceholder="Buscar por nome..."
				table={table}
			/>
			<DataTable.Content
				isEmpty={isEmpty}
				isError={isError}
				isLoading={isLoading}
				onRowClick={(entry) => router.push(`/items/${entry.id}`)}
				rowContextMenu={(entry) => (
					<>
						<ContextMenuItem onClick={() => goToMap({ itemId: entry.id })}>
							<MapPin aria-hidden="true" className="h-4 w-4" />
							Ver no mapa
						</ContextMenuItem>
						<ContextMenuItem onClick={() => router.push(`/items/${entry.id}`)}>
							<Pencil aria-hidden="true" className="h-4 w-4" />
							Editar
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() => setArchiveItem(entry)}
							variant="destructive"
						>
							<Trash2 aria-hidden="true" className="h-4 w-4" />
							Excluir
						</ContextMenuItem>
					</>
				)}
				rows={rows}
				table={table}
			/>
			<DataTable.Pagination
				isLoading={isLoading}
				pageCount={query.pageCount}
				pageIndex={pageIndex}
				pageSize={pageSize}
				table={table}
			/>
		</>
	);
}

export default function ItemsPage() {
	return (
		<DataTable>
			<Suspense fallback={null}>
				<ItemsTableContent />
			</Suspense>
		</DataTable>
	);
}
