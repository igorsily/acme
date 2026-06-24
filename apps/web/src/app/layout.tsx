import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";

const montserrat = Montserrat({
	subsets: ["latin"],
	variable: "--font-montserrat",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Acme",
	description: "Acme template application",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html className={montserrat.variable} lang="pt-BR" suppressHydrationWarning>
			<body className="font-sans antialiased">
				<Providers>
					<div className="grid h-svh grid-rows-[auto_1fr]">{children}</div>
				</Providers>
			</body>
		</html>
	);
}
