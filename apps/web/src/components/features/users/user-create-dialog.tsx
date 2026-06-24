"use client";

import { userCreateSchema } from "@acme/types/schemas/user.schema";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@acme/ui/components/dialog";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createFormFactory } from "@/components/form-factory";
import { queryClient, trpc } from "@/lib/trpc";

const userCreateFormFactory = createFormFactory({
	schema: userCreateSchema,
	defaultValues: {
		name: "",
		email: "",
		sendInvitationEmail: true,
	},
});

type UserCreateDialogProps = {
	onOpenChange: (open: boolean) => void;
	open: boolean;
};

export function UserCreateDialog({
	open,
	onOpenChange,
}: UserCreateDialogProps) {
	const createMutation = useMutation(
		trpc.user.create.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: trpc.user.list.queryKey(),
				});
				toast.success("Usuário criado com sucesso.");
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const form = userCreateFormFactory.useForm({
		onSubmit: async (values) => {
			await createMutation.mutateAsync(values);
		},
	});

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			form.instance.reset();
		}

		onOpenChange(nextOpen);
	}

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Criar usuário</DialogTitle>
					<DialogDescription>
						Cadastre um novo usuário. O convidado precisará concluir o cadastro
						para acessar a plataforma.
					</DialogDescription>
				</DialogHeader>
				<form.Form className="flex flex-col gap-4">
					<form.Field label="Nome" name="name" placeholder="Nome completo" />
					<form.Field
						label="E-mail"
						name="email"
						placeholder="email@empresa.com"
						type="email"
					/>
					<form.Field
						label="Enviar e-mail de convite"
						name="sendInvitationEmail"
						type="checkbox"
					/>
					<form.Submit>
						{({ isSubmitting }) =>
							isSubmitting || createMutation.isPending
								? "Criando..."
								: "Criar usuário"
						}
					</form.Submit>
				</form.Form>
			</DialogContent>
		</Dialog>
	);
}
