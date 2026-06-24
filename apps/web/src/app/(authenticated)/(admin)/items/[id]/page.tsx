"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ItemForm } from "@/components/features/items/item-form";
import { getItemFormKey } from "@/components/features/items/item-form.utils";
import { trpc } from "@/lib/trpc";

export default function ItemDetailPage() {
	const params = useParams<{ id: string }>();
	const itemId = params.id === "novo" ? undefined : params.id;

	const formKey = getItemFormKey(itemId);

	const detailQuery = useQuery({
		...trpc.item.getById.queryOptions({ id: itemId ?? "" }),
		enabled: Boolean(itemId),
	});

	if (itemId && detailQuery.isLoading) {
		return (
			<div className="text-muted-foreground text-sm">Carregando item...</div>
		);
	}

	if (itemId && detailQuery.isError) {
		return (
			<div className="text-destructive text-sm">
				Não foi possível carregar o item.
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<ItemForm initialData={detailQuery.data} itemId={itemId} key={formKey} />
		</div>
	);
}
