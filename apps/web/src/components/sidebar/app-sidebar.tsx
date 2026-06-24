"use client";

import { Separator } from "@acme/ui/components/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@acme/ui/components/sidebar";
import { Box, Map as MapIcon, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type * as React from "react";
import { BrandLogo } from "@/components/brand-logo";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

type NavItem = {
	icon: React.ReactNode;
	title: string;
	url: Route;
};

const navMain: NavItem[] = [
	{
		title: "Mapa",
		icon: <MapIcon />,
		url: "/",
	},
	{
		title: "Itens",
		icon: <Box />,
		url: "/items",
	},
	{
		title: "Usuários",
		icon: <Users />,
		url: "/users",
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton render={<Link href="/" />} size="lg">
							<BrandLogo className="max-h-8" height={32} inverted width={128} />
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<Separator />
			<SidebarContent>
				<NavMain items={navMain} label="Menu" />
			</SidebarContent>
			<Separator />
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
