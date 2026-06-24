"use client";

import type { UserList } from "@acme/types/schemas/user.schema";
import { useMutation } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { Suspense, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTable } from "@/components/data-table/hooks/use-data-table";
import { createUserColumns } from "@/components/features/users/user-columns";
import { UserCreateDialog } from "@/components/features/users/user-create-dialog";
import { useListQuery } from "@/hooks/use-list-query";
import { trpc } from "@/lib/trpc";

function UsersTableContent() {
	const [createOpen, setCreateOpen] = useState(false);
	const [resendingUserId, setResendingUserId] = useState<string | null>(null);

	const resendInviteMutation = useMutation(
		trpc.user.resendInvite.mutationOptions({
			onSuccess: () => {
				toast.success("Convite reenviado com sucesso.");
			},
			onError: (error) => {
				toast.error(error.message);
			},
			onSettled: () => {
				setResendingUserId(null);
			},
		})
	);

	const handleResendInvite = useCallback(
		(targetUser: UserList) => {
			setResendingUserId(targetUser.id);
			resendInviteMutation.mutate({ userId: targetUser.id });
		},
		[resendInviteMutation.mutate]
	);

	const columns = useMemo(
		() =>
			createUserColumns({
				isResendingUserId: resendingUserId,
				onResendInvite: handleResendInvite,
			}),
		[handleResendInvite, resendingUserId]
	);

	const query = useListQuery((input) => trpc.user.list.queryOptions(input));
	const { table, rows, isLoading, isEmpty, isError, pageIndex, pageSize } =
		useDataTable({
			columns,
			pageCount: query.pageCount,
			query,
		});

	return (
		<>
			<div>
				<h1 className="font-semibold text-2xl">Usuários</h1>
				<p className="text-muted-foreground text-sm">
					Gerencie os usuários do sistema.
				</p>
			</div>
			<DataTable.Toolbar
				actions={[
					{
						label: "Criar usuário",
						onClick: () => {
							setCreateOpen(true);
						},
						icon: <UserPlus />,
					},
				]}
				searchPlaceholder="Buscar usuários..."
				table={table}
			/>
			<DataTable.Content
				isEmpty={isEmpty}
				isError={isError}
				isLoading={isLoading}
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
			<UserCreateDialog onOpenChange={setCreateOpen} open={createOpen} />
		</>
	);
}

export default function UsersPage() {
	return (
		<DataTable>
			<Suspense fallback={null}>
				<UsersTableContent />
			</Suspense>
		</DataTable>
	);
}
