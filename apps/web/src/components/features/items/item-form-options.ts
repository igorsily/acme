import type { ItemStatus } from "@acme/types/schemas/item.schema";

export const itemStatusOptions: Array<{ label: string; value: ItemStatus }> = [
	{ label: "Rascunho", value: "draft" },
	{ label: "Ativo", value: "active" },
	{ label: "Arquivado", value: "archived" },
];
