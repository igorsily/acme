"use client";

import type { UserList } from "@acme/types/schemas/user.schema";
import type { ColumnDef } from "@tanstack/react-table";
import { Mail } from "lucide-react";
import {
	type DataTableRowAction,
	DataTableRowActions,
} from "@/components/data-table/cells/data-table-row-actions";
import { StatusBadge } from "@/components/data-table/cells/status-badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

const bannedStatusMap = {
	true: { label: "Sim", variant: "success" },
	false: { label: "Não", variant: "destructive" },
	null: { label: "—", variant: "outline" },
} as const;

const emailVerifiedStatusMap = {
	true: { label: "Sim", variant: "success" },
	false: { label: "Não", variant: "outline" },
} as const;

type CreateUserColumnsOptions = {
	isResendingUserId: string | null;
	onResendInvite: (user: UserList) => void;
};

export function createUserColumns({
	isResendingUserId,
	onResendInvite,
}: CreateUserColumnsOptions): ColumnDef<UserList>[] {
	return [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Nome" />
			),
			meta: { filterType: "text" },
		},
		{
			accessorKey: "email",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="E-mail" />
			),
			meta: {
				filterType: "text",
			},
		},
		{
			accessorKey: "emailVerified",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="E-mail verificado" />
			),
			cell: ({ row }) => (
				<StatusBadge
					status={row.original.emailVerified ? "true" : "false"}
					statusMap={emailVerifiedStatusMap}
				/>
			),
			meta: {
				filterOptions: [
					{ label: "Sim", value: "true" },
					{ label: "Não", value: "false" },
				],
				filterType: "select",
			},
		},
		{
			accessorKey: "banned",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Ativo" />
			),
			cell: ({ row }) => (
				<StatusBadge
					status={row.original.banned ? "false" : "true"}
					statusMap={bannedStatusMap}
				/>
			),
			meta: {
				filterType: "boolean",
			},
		},
		{
			id: "actions",
			header: () => <span className="sr-only">Ações</span>,
			cell: ({ row }) => {
				const actions: DataTableRowAction[] = [];

				if (!row.original.emailVerified) {
					actions.push({
						label:
							isResendingUserId === row.original.id
								? "Reenviando..."
								: "Reenviar convite",
						icon: <Mail aria-hidden="true" className="h-4 w-4" />,
						onClick: () => {
							onResendInvite(row.original);
						},
					});
				}

				if (actions.length === 0) {
					return null;
				}

				return <DataTableRowActions actions={actions} />;
			},
			enableSorting: false,
		},
	];
}
