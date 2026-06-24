import type { ItemList } from "@acme/types/schemas/item.schema";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { DataTableRowActions } from "@/components/data-table/cells/data-table-row-actions";
import { DateCell } from "@/components/data-table/cells/date-cell";
import {
	StatusBadge,
	type StatusConfig,
} from "@/components/data-table/cells/status-badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const itemStatusMap: Record<string, StatusConfig> = {
	draft: { label: "Rascunho", variant: "secondary" },
	active: { label: "Ativo", variant: "default" },
	archived: { label: "Arquivado", variant: "outline" },
};

export const itemStatusFilterOptions = [
	{ label: "Rascunho", value: "draft" },
	{ label: "Ativo", value: "active" },
	{ label: "Arquivado", value: "archived" },
];

type CreateItemColumnsOptions = {
	onArchive: (item: ItemList) => void;
	onEdit: (item: ItemList) => void;
};

export function createItemColumns({
	onEdit,
	onArchive,
}: CreateItemColumnsOptions): ColumnDef<ItemList>[] {
	return [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Nome" />
			),
			meta: { filterType: "text" },
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Descrição" />
			),
			cell: ({ row }) => row.original.description ?? "—",
			meta: { filterType: "text" },
		},
		{
			accessorKey: "address",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Endereço" />
			),
			cell: ({ row }) => row.original.address ?? "—",
			meta: { filterType: "text" },
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Criado em" />
			),
			cell: ({ row }) => <DateCell date={row.original.createdAt} />,
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Status" />
			),
			cell: ({ row }) => (
				<StatusBadge status={row.original.status} statusMap={itemStatusMap} />
			),
			meta: {
				filterType: "select",
				filterOptions: itemStatusFilterOptions,
			},
		},
		{
			id: "actions",
			header: () => <span className="sr-only">Ações</span>,
			cell: ({ row }) => (
				<DataTableRowActions
					actions={[
						{
							label: "Editar",
							icon: <Pencil aria-hidden="true" className="h-4 w-4" />,
							onClick: () => onEdit(row.original),
						},
						{
							label: "Excluir",
							icon: <Trash2 aria-hidden="true" className="h-4 w-4" />,
							onClick: () => onArchive(row.original),
							variant: "destructive",
						},
					]}
				/>
			),
			enableSorting: false,
		},
	];
}
