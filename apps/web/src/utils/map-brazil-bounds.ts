/** Bounding box continental Brasil + Fernando de Noronha (EPSG:4326). */
export const BRAZIL_BOUNDS = {
	minLat: -33.75,
	maxLat: 5.27,
	minLng: -73.99,
	maxLng: -32.4,
} as const;

/** Espírito Santo + entorno imediato — região operacional padrão do mapa. */
export const DEFAULT_MAP_CENTER = {
	lng: -40.289_292_937_937,
	lat: -20.340_237_548_626_845,
} as const;

const MAX_FIT_BOUNDS_SPAN_DEGREES = 8;

export function isValidBrazilCoordinate(lat: number, lng: number): boolean {
	if (lat === 0 && lng === 0) {
		return false;
	}

	return (
		lat >= BRAZIL_BOUNDS.minLat &&
		lat <= BRAZIL_BOUNDS.maxLat &&
		lng >= BRAZIL_BOUNDS.minLng &&
		lng <= BRAZIL_BOUNDS.maxLng
	);
}

export function filterValidMapMarkers<T extends { lat: number; lng: number }>(
	markers: T[]
): T[] {
	return markers.filter((marker) =>
		isValidBrazilCoordinate(marker.lat, marker.lng)
	);
}

export function canFitBoundsToMarkers(
	markers: Array<{ lat: number; lng: number }>
): boolean {
	if (markers.length === 0) {
		return false;
	}

	if (markers.length === 1) {
		return true;
	}

	const lats = markers.map((m) => m.lat);
	const lngs = markers.map((m) => m.lng);
	const latSpan = Math.max(...lats) - Math.min(...lats);
	const lngSpan = Math.max(...lngs) - Math.min(...lngs);

	return (
		latSpan <= MAX_FIT_BOUNDS_SPAN_DEGREES &&
		lngSpan <= MAX_FIT_BOUNDS_SPAN_DEGREES
	);
}
