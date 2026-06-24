import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";

type UserInviteEmailProps = {
	inviteUrl: string;
	name: string;
};

export function UserInviteEmail({ inviteUrl, name }: UserInviteEmailProps) {
	return (
		<Html lang="pt-BR">
			<Head />
			<Preview>Complete seu cadastro no Acme</Preview>
			<Body style={bodyStyle}>
				<Container style={containerStyle}>
					<Heading style={headingStyle}>Bem-vindo ao Acme</Heading>
					<Text style={textStyle}>Olá, {name}.</Text>
					<Text style={textStyle}>
						Você foi convidado para acessar a plataforma. Clique no botão abaixo
						para definir seu usuário e senha e concluir o cadastro.
					</Text>
					<Section style={buttonSectionStyle}>
						<Button href={inviteUrl} style={buttonStyle}>
							Concluir cadastro
						</Button>
					</Section>
					<Text style={mutedTextStyle}>
						Se o botão não funcionar, copie e cole este link no navegador:
					</Text>
					<Text style={linkTextStyle}>{inviteUrl}</Text>
					<Hr style={hrStyle} />
					<Text style={mutedTextStyle}>
						Este convite expira em 7 dias. Se você não esperava este e-mail,
						pode ignorá-lo com segurança.
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

const bodyStyle = {
	backgroundColor: "#f4f4f5",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	margin: "0",
	padding: "24px 0",
};

const containerStyle = {
	backgroundColor: "#ffffff",
	borderRadius: "8px",
	margin: "0 auto",
	maxWidth: "560px",
	padding: "32px",
};

const headingStyle = {
	color: "#18181b",
	fontSize: "24px",
	fontWeight: "600",
	lineHeight: "32px",
	margin: "0 0 16px",
};

const textStyle = {
	color: "#3f3f46",
	fontSize: "16px",
	lineHeight: "24px",
	margin: "0 0 16px",
};

const mutedTextStyle = {
	color: "#71717a",
	fontSize: "14px",
	lineHeight: "20px",
	margin: "0 0 8px",
};

const linkTextStyle = {
	color: "#2563eb",
	fontSize: "14px",
	lineHeight: "20px",
	margin: "0 0 16px",
	wordBreak: "break-all" as const,
};

const buttonSectionStyle = {
	margin: "24px 0",
	textAlign: "center" as const,
};

const buttonStyle = {
	backgroundColor: "#18181b",
	borderRadius: "6px",
	color: "#ffffff",
	display: "inline-block",
	fontSize: "16px",
	fontWeight: "600",
	padding: "12px 24px",
	textDecoration: "none",
};

const hrStyle = {
	borderColor: "#e4e4e7",
	margin: "24px 0",
};
