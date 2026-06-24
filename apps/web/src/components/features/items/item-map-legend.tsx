import {
	ItemMapPin,
	itemStatusLegendItems,
} from "@/components/features/items/item-map-pin";

export function ItemMapLegend() {
	return (
		<div className="pointer-events-none absolute right-3 bottom-3 z-10 rounded-md border border-border bg-background/95 p-3 shadow-md backdrop-blur-sm">
			<p className="mb-2 font-medium text-muted-foreground text-xs">
				Status dos itens
			</p>
			<ul className="flex flex-col gap-1.5">
				{itemStatusLegendItems.map(({ status, label }) => (
					<li className="flex items-center gap-2" key={status}>
						<ItemMapPin className="size-4 shrink-0" status={status} />
						<span className="text-foreground text-xs">{label}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
