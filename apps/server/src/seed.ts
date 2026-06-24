import { auth } from "@acme/auth";
import { db } from "@acme/db";

const adminUser = {
	name: "Igor Sily",
	email: "igorsily2@gmail.com",
	password: "10342512ws",
	username: "igorsily",
	displayUsername: "Igor Sily",
};

async function seed() {
	console.log("🌱 Iniciando seed do admin...\n");

	try {
		await auth.api.signUpEmail({
			body: adminUser,
		});

		await db.execute(
			`update "user" set role = 'admin' where email = '${adminUser.email}'`
		);
	} catch (error) {
		const err = error as { body?: { code?: string }; status?: number };

		if (err.body?.code !== "USER_ALREADY_EXISTS" && err.status !== 422) {
			console.error("❌ Erro ao criar usuário admin:", error);
			throw error;
		}

		console.log("⚠️  Usuário admin já existe (continuando)...");
	}

	console.log("✅ Admin criado/atualizado com sucesso!");
	process.exit(0);
}

seed().catch((error) => {
	console.error("\n❌ Seed falhou:", error);
	process.exit(1);
});
