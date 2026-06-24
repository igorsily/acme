"use client";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@acme/ui/components/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@acme/ui/components/sidebar";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

type NavSubItem = {
	title: string;
	url: React.ComponentProps<typeof Link>["href"];
};

type NavItem = {
	icon?: React.ReactNode;
	isActive?: boolean;
	items?: NavSubItem[];
	title: string;
	url: React.ComponentProps<typeof Link>["href"];
};

export function NavMain({ items, label }: { label: string; items: NavItem[] }) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) =>
					item.items && item.items.length > 0 ? (
						<Collapsible
							className="group/collapsible"
							defaultOpen={item.isActive}
							key={item.title}
						>
							<CollapsibleTrigger
								render={
									<SidebarMenuButton tooltip={item.title}>
										{item.icon}
										<span>{item.title}</span>
										<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
									</SidebarMenuButton>
								}
							/>
							<CollapsibleContent>
								<SidebarMenuSub>
									{item.items.map((subItem) => (
										<SidebarMenuSubItem key={subItem.title}>
											<SidebarMenuSubButton
												render={<Link href={subItem.url} />}
											>
												<span>{subItem.title}</span>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									))}
								</SidebarMenuSub>
							</CollapsibleContent>
						</Collapsible>
					) : (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								render={<Link href={item.url} />}
								tooltip={item.title}
							>
								{item.icon}
								<span>{item.title}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					)
				)}
			</SidebarMenu>
		</SidebarGroup>
	);
}
