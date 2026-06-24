import { ModeToggle } from "@/components/mode-toggle";

export default function PublicLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="relative min-h-svh overflow-hidden">
			<header className="fixed top-4 right-4 z-9999">
				<div className="rounded-lg bg-background text-foreground">
					<ModeToggle />
				</div>
			</header>

			<main className="relative min-h-svh">{children}</main>
		</div>
	);
}
