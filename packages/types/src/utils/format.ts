import { stripNonDigits } from "../schemas/mask.schema";

const CNPJ_FORMAT_REGEX = /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/;
const PHONE_10_DIGITS_REGEX = /^(\d{2})(\d{4})(\d{4})$/;
const PHONE_11_DIGITS_REGEX = /^(\d{2})(\d{5})(\d{4})$/;

export function formatCnpj(value: string): string {
	const digits = stripNonDigits(value);

	if (digits.length !== 14) {
		return value;
	}

	return digits.replace(CNPJ_FORMAT_REGEX, "$1.$2.$3/$4-$5");
}

export function formatPhone(value: string): string {
	const digits = stripNonDigits(value);

	if (digits.length === 10) {
		return digits.replace(PHONE_10_DIGITS_REGEX, "($1) $2-$3");
	}

	if (digits.length === 11) {
		return digits.replace(PHONE_11_DIGITS_REGEX, "($1) $2-$3");
	}

	return value;
}

export function formatCoordinate(value: number): string {
	return value.toFixed(6);
}
