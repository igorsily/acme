import type { ItemStatus } from "@acme/types/schemas/item.schema";
import { cn } from "@acme/ui/lib/utils";
import { MapPin } from "lucide-react";
import { itemStatusMap } from "@/components/features/items/item-columns";

export const itemStatusPinClass: Record<ItemStatus, string> = {
	draft: "text-muted-foreground fill-muted",
	active: "text-primary fill-primary/20",
	archived: "text-destructive fill-destructive/20",
};

export const itemStatusLegendItems = (
	Object.keys(itemStatusMap) as ItemStatus[]
).map((status) => ({
	status,
	label: itemStatusMap[status]?.label ?? status,
	pinClassName: itemStatusPinClass[status],
}));

type ItemMapPinProps = {
	status: ItemStatus;
	className?: string;
};

export function ItemMapPin({ status, className }: ItemMapPinProps) {
	return (
		<MapPin
			aria-hidden="true"
			className={cn(
				"size-7 drop-shadow-md",
				itemStatusPinClass[status],
				className
			)}
		/>
	);
}
