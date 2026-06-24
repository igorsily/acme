"use client";

import {
	MapMarker,
	MarkerContent,
	MarkerPopup,
	useMap,
} from "@acme/ui/components/ui/map";
import { useQuery } from "@tanstack/react-query";
import MapLibreGL from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import { ItemMapPin } from "@/components/features/items/item-map-pin";
import { ItemMapPopupCard } from "@/components/features/items/item-map-popup-card";
import { trpc } from "@/lib/trpc";
import { useMapFocusStore } from "@/stores/map-focus-store";
import {
	canFitBoundsToMarkers,
	DEFAULT_MAP_CENTER,
	filterValidMapMarkers,
} from "@/utils/map-brazil-bounds";

const FIT_BOUNDS_PADDING = 60;
const SINGLE_MARKER_ZOOM = 14;
const MAX_FIT_ZOOM = 15;

function fitMapToMarkers(
	map: MapLibreGL.Map,
	markers: Array<{ lat: number; lng: number }>
) {
	if (markers.length === 1) {
		const [marker] = markers;
		if (!marker) {
			return;
		}

		map.flyTo({
			center: [marker.lng, marker.lat],
			zoom: SINGLE_MARKER_ZOOM,
			duration: 1000,
		});
		return;
	}

	const first = markers[0];
	if (!first) {
		return;
	}

	const bounds = new MapLibreGL.LngLatBounds(
		[first.lng, first.lat],
		[first.lng, first.lat]
	);

	for (const marker of markers.slice(1)) {
		bounds.extend([marker.lng, marker.lat]);
	}

	map.fitBounds(bounds, {
		padding: FIT_BOUNDS_PADDING,
		maxZoom: MAX_FIT_ZOOM,
		duration: 1000,
	});
}

export function ItemMapMarkers() {
	const { map, isLoaded } = useMap();
	const hasAdjustedView = useRef(false);
	const mapFocus = useMapFocusStore((state) => state.mapFocus);
	const { data: markers = [] } = useQuery(trpc.item.listForMap.queryOptions());

	const validMarkers = useMemo(() => filterValidMapMarkers(markers), [markers]);

	useEffect(() => {
		if (!map) {
			return;
		}
		if (!isLoaded) {
			return;
		}
		if (hasAdjustedView.current) {
			return;
		}

		if (mapFocus) {
			hasAdjustedView.current = true;
			return;
		}

		if (validMarkers.length === 0) {
			return;
		}

		if (canFitBoundsToMarkers(validMarkers)) {
			fitMapToMarkers(map, validMarkers);
		} else {
			map.flyTo({
				center: [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat],
				zoom: 14,
				duration: 1000,
			});
		}

		hasAdjustedView.current = true;
	}, [map, isLoaded, mapFocus, validMarkers]);

	return (
		<>
			{validMarkers.map((entry) => (
				<MapMarker key={entry.id} latitude={entry.lat} longitude={entry.lng}>
					<MarkerContent>
						<ItemMapPin status={entry.status} />
					</MarkerContent>
					<MarkerPopup
						className="w-[min(26rem,94vw)] overflow-hidden p-0"
						closeButton
						offset={24}
					>
						<ItemMapPopupCard item={entry} />
					</MarkerPopup>
				</MapMarker>
			))}
		</>
	);
}
