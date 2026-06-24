import type { Mask } from "use-mask-input";

export const MASK_PRESETS = {
	cpf: "cpf",
	cnpj: "cnpj",
	phone: "(99) 99999-9999",
	cep: "99999-999",
	currency: "brl-currency",
	integer: "integer",
	decimal: "decimal",
} as const satisfies Record<string, Mask>;

export type MaskPreset = keyof typeof MASK_PRESETS;

export function resolveMask(mask: MaskPreset | Mask): Mask {
	if (typeof mask === "string" && mask in MASK_PRESETS) {
		return MASK_PRESETS[mask as MaskPreset];
	}

	return mask;
}
