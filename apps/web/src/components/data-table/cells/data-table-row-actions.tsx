"use client";

import { Button } from "@acme/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@acme/ui/components/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import type * as React from "react";

export type DataTableRowAction = {
	icon?: React.ReactNode;
	label: string;
	onClick: () => void;
	variant?: "default" | "destructive";
};

type DataTableRowActionsProps = {
	actions: DataTableRowAction[];
};

export function DataTableRowActions({ actions }: DataTableRowActionsProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" />}>
				<EllipsisVertical aria-hidden="true" />
				<span className="sr-only">Abrir menu de ações</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{actions.map((action) => (
					<DropdownMenuItem
						key={action.label}
						onClick={action.onClick}
						variant={action.variant}
					>
						{action.icon}
						{action.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
