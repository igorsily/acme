import type {
	ItemDetail,
	ItemFormValues,
} from "@acme/types/schemas/item.schema";

export const emptyItemFormValues: ItemFormValues = {
	name: "",
	description: "",
	status: "draft",
	address: "",
};

export function getItemFormDefaultValues(
	initialData?: ItemDetail
): ItemFormValues {
	if (!initialData) {
		return emptyItemFormValues;
	}

	return {
		name: initialData.name,
		description: initialData.description ?? "",
		status: initialData.status,
		address: initialData.address ?? "",
		lat: initialData.lat,
		lng: initialData.lng,
	};
}

export function getItemFormKey(itemId?: string): string {
	return itemId ?? "new";
}
