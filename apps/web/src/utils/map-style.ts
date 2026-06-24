import type MapLibreGL from "maplibre-gl";

export const osmStyle: MapLibreGL.StyleSpecification = {
	version: 8,
	sources: {
		osm: {
			type: "raster",
			tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
			tileSize: 256,
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		},
	},
	layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export const googleStyle: MapLibreGL.StyleSpecification = {
	version: 8,
	sources: {
		google: {
			type: "raster",
			tiles: ["https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"],
			tileSize: 256,
			attribution:
				'&copy; <a href="https://www.google.com/maps">Google Maps</a>',
		},
	},
	layers: [
		{
			id: "google-maps",
			type: "raster",
			source: "google",
		},
	],
};
