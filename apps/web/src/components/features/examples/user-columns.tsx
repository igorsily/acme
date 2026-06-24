import type { ColumnDef } from "@tanstack/react-table";
import { DateCell } from "@/components/data-table/cells/date-cell";
import { StatusBadge } from "@/components/data-table/cells/status-badge";
import { UserAvatarCell } from "@/components/data-table/cells/user-avatar-cell";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { MockUser } from "./mock-user-data";

const STATUS_MAP: Record<
	MockUser["status"],
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline";
	}
> = {
	active: { label: "Ativo", variant: "default" },
	inactive: { label: "Inativo", variant: "secondary" },
	pending: { label: "Pendente", variant: "outline" },
	banned: { label: "Banido", variant: "destructive" },
};

const ROLE_MAP: Record<MockUser["role"], { label: string }> = {
	admin: { label: "Admin" },
	manager: { label: "Gerente" },
	user: { label: "Usuário" },
	viewer: { label: "Visitante" },
};

export const userColumns: ColumnDef<MockUser>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nome" />
		),
		cell: ({ row }) => (
			<UserAvatarCell
				avatarUrl={row.original.avatarUrl}
				name={row.original.name}
			/>
		),
		meta: {
			filterType: "text",
		},
	},
	{
		accessorKey: "email",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Email" />
		),
		meta: {
			filterType: "text",
		},
	},
	{
		accessorKey: "role",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Cargo" />
		),
		meta: {
			filterType: "select",
			filterOptions: [
				{ label: ROLE_MAP.admin.label, value: "admin" },
				{ label: ROLE_MAP.manager.label, value: "manager" },
				{ label: ROLE_MAP.user.label, value: "user" },
				{ label: ROLE_MAP.viewer.label, value: "viewer" },
			],
		},
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => (
			<StatusBadge status={row.original.status} statusMap={STATUS_MAP} />
		),
		meta: {
			filterType: "select",
			filterOptions: [
				{ label: "Ativo", value: "active" },
				{ label: "Inativo", value: "inactive" },
				{ label: "Pendente", value: "pending" },
				{ label: "Banido", value: "banned" },
			],
		},
	},
	{
		accessorKey: "banned",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Banido" />
		),
		cell: ({ row }) => (row.original.banned ? "Sim" : "Não"),
		meta: {
			filterType: "boolean",
		},
	},
	{
		accessorKey: "department",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Departamento" />
		),
		meta: {
			filterType: "select",
			filterOptions: [
				{ label: "Engenharia", value: "engineering" },
				{ label: "Design", value: "design" },
				{ label: "Marketing", value: "marketing" },
				{ label: "Vendas", value: "sales" },
				{ label: "RH", value: "hr" },
			],
		},
	},
	{
		accessorKey: "age",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Idade" />
		),
		meta: {
			filterType: "number",
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Criado em" />
		),
		cell: ({ row }) => <DateCell date={row.original.createdAt} />,
		meta: {
			filterType: "date",
		},
	},
];
