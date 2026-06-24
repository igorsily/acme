"use client";

import type { ItemDetail } from "@acme/types/schemas/item.schema";
import { itemFormSchema } from "@acme/types/schemas/item.schema";
import { buttonVariants } from "@acme/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@acme/ui/components/card";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	emptyItemFormValues,
	getItemFormDefaultValues,
} from "@/components/features/items/item-form.utils";
import { itemStatusOptions } from "@/components/features/items/item-form-options";
import { createFormFactory } from "@/components/form-factory";
import { queryClient, trpc } from "@/lib/trpc";

const itemFormFactory = createFormFactory({
	schema: itemFormSchema,
	defaultValues: emptyItemFormValues,
});

type ItemFormProps = {
	itemId?: string;
	initialData?: ItemDetail;
};

export function ItemForm({ itemId, initialData }: ItemFormProps) {
	const router = useRouter();
	const isEditing = Boolean(itemId);

	const createMutation = useMutation(
		trpc.item.create.mutationOptions({
			onSuccess: async (result) => {
				await queryClient.invalidateQueries({
					queryKey: trpc.item.list.queryKey(),
				});
				toast.success("Item criado com sucesso.");
				router.push(`/items/${result.id}`);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const updateMutation = useMutation(
		trpc.item.update.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: trpc.item.list.queryKey(),
				});
				if (itemId) {
					await queryClient.invalidateQueries({
						queryKey: trpc.item.getById.queryKey({ id: itemId }),
					});
				}
				toast.success("Item atualizado com sucesso.");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const form = itemFormFactory.useForm({
		defaultValues: getItemFormDefaultValues(initialData),
		onSubmit: async (values) => {
			if (isEditing && itemId) {
				await updateMutation.mutateAsync({ id: itemId, ...values });
				return;
			}

			await createMutation.mutateAsync(values);
		},
	});

	function getSubmitLabel(isFormSubmitting: boolean) {
		if (
			isFormSubmitting ||
			createMutation.isPending ||
			updateMutation.isPending
		) {
			return "Salvando...";
		}

		if (isEditing) {
			return "Salvar alterações";
		}

		return "Criar item";
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Link
						className={buttonVariants({ variant: "ghost", size: "icon" })}
						href="/items"
					>
						<ArrowLeft aria-hidden="true" className="size-4" />
						<span className="sr-only">Voltar</span>
					</Link>
					<div>
						<h1 className="font-semibold text-2xl">
							{isEditing ? "Editar item" : "Novo item"}
						</h1>
						<p className="text-muted-foreground text-sm">
							{isEditing
								? "Atualize os dados do item."
								: "Preencha os dados para cadastrar um novo item."}
						</p>
					</div>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Dados do item</CardTitle>
					<CardDescription>
						Informações básicas e localização opcional.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form.Form className="grid gap-4 md:grid-cols-2">
						<form.Field
							className="md:col-span-2"
							label="Nome"
							name="name"
							placeholder="Nome do item"
						/>
						<form.Field
							className="md:col-span-2"
							label="Descrição"
							name="description"
							placeholder="Descrição opcional"
							type="textarea"
						/>
						<form.Field
							label="Status"
							name="status"
							options={itemStatusOptions}
							type="select"
						/>
						<form.Field
							className="md:col-span-2"
							label="Endereço"
							name="address"
							placeholder="Endereço completo"
						/>
						<form.Field
							label="Latitude"
							name="lat"
							placeholder="-23.5505"
							type="number"
						/>
						<form.Field
							label="Longitude"
							name="lng"
							placeholder="-46.6333"
							type="number"
						/>
						<div className="md:col-span-2">
							<form.Submit>
								{({ isSubmitting }) => getSubmitLabel(isSubmitting)}
							</form.Submit>
						</div>
					</form.Form>
				</CardContent>
			</Card>
		</div>
	);
}
