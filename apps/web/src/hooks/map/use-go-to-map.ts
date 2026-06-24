import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {
	type MapFocusTarget,
	useMapFocusStore,
} from "@/stores/map-focus-store";

export function useGoToMap() {
	const router = useRouter();
	const setMapFocus = useMapFocusStore((state) => state.setMapFocus);

	const goToMap = useCallback(
		(target: MapFocusTarget) => {
			setMapFocus(target);
			router.push("/");
		},
		[router, setMapFocus]
	);

	return goToMap;
}
