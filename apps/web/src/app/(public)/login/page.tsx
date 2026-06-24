"use client";

import { Button } from "@acme/ui/components/button";
import { Card, CardContent, CardHeader } from "@acme/ui/components/card";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BrandLogo } from "@/components/brand-logo";
import { createFormFactory } from "@/components/form-factory/create-form-factory";
import { LoginBackground } from "@/components/login-background";
import { authClient } from "@/lib/auth-client";

const loginFormFactory = createFormFactory({
	defaultValues: {
		password: "",
		username: "",
	},
	schema: z.object({
		password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
		username: z.string().min(3, "Informe um usuário válido"),
	}),
});

export default function LoginPage() {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	const router = useRouter();

	const form = loginFormFactory.useForm({
		onSubmit: async (value) => {
			await authClient.signIn.username(
				{
					username: value.username,
					password: value.password,
				},
				{
					onSuccess: () => {
						router.push("/");
					},
					onError: (error) => {
						toast.error(error.error.message || "Credenciais inválidas.");
					},
				}
			);
		},
	});

	return (
		<section className="relative flex min-h-svh items-center justify-center p-6">
			<LoginBackground />
			<Card className="w-full max-w-xl border-border/60 bg-card/95 shadow-xl backdrop-blur-sm">
				<CardHeader className="mx-3">
					<BrandLogo className="mx-auto max-w-sm" height={120} width={400} />
				</CardHeader>
				<CardContent className="flex flex-col gap-6 px-8 py-6">
					<form.Form className="flex flex-col gap-4">
						<form.Field
							autoComplete="username"
							label="Usuário"
							name="username"
							placeholder=""
						/>
						<form.Field
							autoComplete="current-password"
							description="Use qualquer senha com 8+ caracteres."
							label="Senha"
							name="password"
							rightSection={
								<Button
									aria-label={
										isPasswordVisible ? "Ocultar senha" : "Mostrar senha"
									}
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
						<form.Submit>Entrar</form.Submit>
					</form.Form>
				</CardContent>
			</Card>
		</section>
	);
}
