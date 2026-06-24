"use client";

import { userCompleteInviteFormSchema } from "@acme/types/schemas/user.schema";
import { Button } from "@acme/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@acme/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { createFormFactory } from "@/components/form-factory";
import { LoginBackground } from "@/components/login-background";
import { trpc } from "@/lib/trpc";

const completeInviteFormFactory = createFormFactory({
	schema: userCompleteInviteFormSchema,
	defaultValues: {
		username: "",
		password: "",
		confirmPassword: "",
	},
});

type CompleteInviteFormProps = {
	token: string;
};

function CompleteInviteForm({ token }: CompleteInviteFormProps) {
	const router = useRouter();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
		useState(false);

	const completeMutation = useMutation(
		trpc.user.completeInvite.mutationOptions({
			onSuccess: () => {
				toast.success("Cadastro concluído. Faça login para continuar.");
				router.push("/login");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const form = completeInviteFormFactory.useForm({
		onSubmit: async (values) => {
			await completeMutation.mutateAsync({
				token,
				...values,
			});
		},
	});

	return (
		<form.Form className="flex flex-col gap-4">
			<form.Field
				autoComplete="username"
				label="Usuário"
				name="username"
				placeholder="seu.usuario"
			/>
			<form.Field
				autoComplete="new-password"
				label="Senha"
				name="password"
				rightSection={
					<Button
						aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
						onClick={() => {
							setIsPasswordVisible((current) => !current);
						}}
						size="icon-xs"
						type="button"
						variant="ghost"
					>
						{isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
					</Button>
				}
				type={isPasswordVisible ? "text" : "password"}
			/>
			<form.Field
				autoComplete="new-password"
				label="Confirmar senha"
				name="confirmPassword"
				rightSection={
					<Button
						aria-label={
							isConfirmPasswordVisible ? "Ocultar senha" : "Mostrar senha"
						}
						onClick={() => {
							setIsConfirmPasswordVisible((current) => !current);
						}}
						size="icon-xs"
						type="button"
						variant="ghost"
					>
						{isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
					</Button>
				}
				type={isConfirmPasswordVisible ? "text" : "password"}
			/>
			<form.Submit>
				{({ isSubmitting }) =>
					isSubmitting || completeMutation.isPending
						? "Concluindo..."
						: "Concluir cadastro"
				}
			</form.Submit>
		</form.Form>
	);
}

export default function ConvitePage() {
	const params = useParams<{ token: string }>();
	const token = params.token;

	const inviteQuery = useQuery(
		trpc.user.getInviteByToken.queryOptions({ token })
	);

	return (
		<section className="relative flex min-h-svh items-center justify-center p-6">
			<LoginBackground />
			<Card className="w-full max-w-xl border-border/60 bg-card/95 shadow-xl backdrop-blur-sm">
				<CardHeader className="mx-3">
					<BrandLogo className="mx-auto max-w-sm" height={120} width={400} />
				</CardHeader>
				<CardContent className="flex flex-col gap-6 px-8 py-6">
					{inviteQuery.isLoading ? (
						<p className="text-center text-muted-foreground text-sm">
							Validando convite...
						</p>
					) : null}

					{inviteQuery.isError ? (
						<div className="space-y-4 text-center">
							<CardTitle>Convite indisponível</CardTitle>
							<CardDescription>{inviteQuery.error.message}</CardDescription>
							<Button render={<Link href="/login" />} variant="outline">
								Ir para o login
							</Button>
						</div>
					) : null}

					{inviteQuery.data ? (
						<>
							<div className="space-y-2 text-center">
								<CardTitle>Conclua seu cadastro</CardTitle>
								<CardDescription>
									Olá, {inviteQuery.data.name}. Defina seu usuário e senha para
									acessar a plataforma.
								</CardDescription>
							</div>
							<CompleteInviteForm token={token} />
						</>
					) : null}
				</CardContent>
			</Card>
		</section>
	);
}
