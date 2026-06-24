"use client";

import { Badge } from "@acme/ui/components/badge";

export type StatusVariant =
	| "default"
	| "secondary"
	| "destructive"
	| "success"
	| "outline";

export type StatusConfig = {
	label: string;
	variant: StatusVariant;
};

type StatusBadgeProps = {
	status: string;
	statusMap: Record<string, StatusConfig>;
};

export function StatusBadge({ status, statusMap }: StatusBadgeProps) {
	const config = statusMap[status] || {
		label: status,
		variant: "outline",
	};

	return <Badge variant={config.variant}>{config.label}</Badge>;
}
