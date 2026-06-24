import { Separator } from "@acme/ui/components/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@acme/ui/components/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

export default function AuthenticatedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="-ml-1" />
						<Separator className="h-6" orientation="vertical" />
					</div>
					<div className="flex items-center gap-2">
						<ModeToggle />
					</div>
				</header>
				<div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-4">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
