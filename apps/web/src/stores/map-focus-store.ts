import { create } from "zustand";

export type MapFocusTarget = {
	itemId: string;
	lat?: number;
	lng?: number;
};

type MapFocusState = {
	mapFocus: MapFocusTarget | null;
};

type MapFocusActions = {
	setMapFocus: (target: MapFocusTarget) => void;
	clearMapFocus: () => void;
};

type MapFocusStore = MapFocusState & MapFocusActions;

export const useMapFocusStore = create<MapFocusStore>((set) => ({
	mapFocus: null,
	setMapFocus: (mapFocus) => set({ mapFocus }),
	clearMapFocus: () => set({ mapFocus: null }),
}));
