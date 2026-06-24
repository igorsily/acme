import { z } from "zod";

export function stripNonDigits(value: string): string {
	return value.replace(/\D/g, "");
}

function maskedDigitsSchema(pattern: RegExp, message: string) {
	return z
		.string()
		.transform(stripNonDigits)
		.pipe(z.string().regex(pattern, message));
}

export const cnpjSchema = maskedDigitsSchema(
	/^\d{14}$/,
	"CNPJ deve ter 14 dígitos"
);

export const cpfSchema = maskedDigitsSchema(
	/^\d{11}$/,
	"CPF deve ter 11 dígitos"
);

export const phoneSchema = maskedDigitsSchema(
	/^\d{10,11}$/,
	"Telefone inválido"
);

export const cepSchema = maskedDigitsSchema(
	/^\d{8}$/,
	"CEP deve ter 8 dígitos"
);
