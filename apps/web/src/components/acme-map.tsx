import {
	MapControls,
	Map as MapView,
	useMap,
} from "@acme/ui/components/ui/map";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { ItemMapLegend } from "@/components/features/items/item-map-legend";
import { ItemMapMarkers } from "@/components/features/items/item-map-markers";
import { trpc } from "@/lib/trpc";
import { useMapFocusStore } from "@/stores/map-focus-store";
import {
	DEFAULT_MAP_CENTER,
	isValidBrazilCoordinate,
} from "@/utils/map-brazil-bounds";
import { googleStyle } from "@/utils/map-style";

const MAP_FOCUS_ZOOM = 16;

function MapFocusSync() {
	const { map, isLoaded } = useMap();
	const mapFocus = useMapFocusStore((state) => state.mapFocus);
	const clearMapFocus = useMapFocusStore((state) => state.clearMapFocus);
	const { data: markers = [] } = useQuery(trpc.item.listForMap.queryOptions());

	useEffect(() => {
		if (!map) {
			return;
		}
		if (!isLoaded) {
			return;
		}
		if (!mapFocus) {
			return;
		}

		let lat = mapFocus.lat;
		let lng = mapFocus.lng;

		if (
			lat === undefined ||
			lng === undefined ||
			!isValidBrazilCoordinate(lat, lng)
		) {
			const marker = markers.find((entry) => entry.id === mapFocus.itemId);
			if (!(marker && isValidBrazilCoordinate(marker.lat, marker.lng))) {
				if (markers.length > 0) {
					toast.error("Este item não possui localização no mapa.");
					clearMapFocus();
				}
				return;
			}

			lat = marker.lat;
			lng = marker.lng;
		}

		map.flyTo({
			center: [lng, lat],
			zoom: MAP_FOCUS_ZOOM,
			duration: 1500,
		});
		clearMapFocus();
	}, [map, isLoaded, mapFocus, markers, clearMapFocus]);

	return null;
}

export function AcmeMap() {
	return (
		<div className="relative h-full w-full overflow-hidden rounded">
			<MapView
				center={[DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat]}
				styles={{
					light: googleStyle,
					dark: googleStyle,
				}}
				zoom={14}
			>
				<MapFocusSync />
				<ItemMapMarkers />

				<MapControls
					position="top-left"
					showCompass
					showFullscreen
					showLocate
					showZoom
				/>
			</MapView>
			<ItemMapLegend />
		</div>
	);
}
