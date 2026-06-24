"use client";

import type { ItemMapMarker } from "@acme/types/schemas/item.schema";
import { buttonVariants } from "@acme/ui/components/button";
import { cn } from "@acme/ui/lib/utils";
import { ArrowRight, Box } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/data-table/cells/status-badge";
import { itemStatusMap } from "@/components/features/items/item-columns";

type ItemMapPopupCardProps = {
	item: ItemMapMarker;
	className?: string;
};

type PopupFieldProps = {
	label: string;
	children: ReactNode;
};

function PopupField({ label, children }: PopupFieldProps) {
	return (
		<div className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-3 py-1.5">
			<dt className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
				{label}
			</dt>
			<dd className="wrap-break-word min-w-0 text-foreground text-xs leading-relaxed">
				{children}
			</dd>
		</div>
	);
}

export function ItemMapPopupCard({ item, className }: ItemMapPopupCardProps) {
	return (
		<div className={cn("flex flex-col", className)}>
			<div className="flex gap-3 border-border/60 border-b p-3 pr-8">
				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<div className="space-y-1.5">
						<div className="flex items-start gap-2">
							<Box
								aria-hidden
								className="mt-0.5 size-3.5 shrink-0 text-primary"
							/>
							<p className="text-pretty font-semibold text-sm leading-snug">
								{item.name}
							</p>
						</div>
						<StatusBadge status={item.status} statusMap={itemStatusMap} />
					</div>

					<Link
						className={buttonVariants({
							size: "sm",
							className: "w-fit shadow-sm",
						})}
						href={`/items/${item.id}`}
					>
						Ver item
						<ArrowRight aria-hidden className="size-3.5" />
					</Link>
				</div>
			</div>

			<dl className="divide-y divide-border/40 px-3 py-1">
				{item.description ? (
					<PopupField label="Descrição">{item.description}</PopupField>
				) : null}
				{item.address ? (
					<PopupField label="Endereço">{item.address}</PopupField>
				) : null}
			</dl>
		</div>
	);
}
