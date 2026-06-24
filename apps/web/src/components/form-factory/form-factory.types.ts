import type { MaskPreset } from "@acme/ui/lib/masks";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";
import type { Mask, Options } from "use-mask-input";
import type { ZodObject, ZodRawShape, z } from "zod";

// ---------------------------------------------------------------------------
// Tipos de campo suportados pelo FormFactory
// ---------------------------------------------------------------------------
export type FieldType =
	| "text"
	| "email"
	| "password"
	| "number"
	| "textarea"
	| "select"
	| "checkbox";

// ---------------------------------------------------------------------------
// Opção de select
// ---------------------------------------------------------------------------
export type SelectOption = {
	label: string;
	value: string;
};

// ---------------------------------------------------------------------------
// Config passada para createFormFactory
// ---------------------------------------------------------------------------
export type FormFactoryConfig<TShape extends ZodRawShape> = {
	defaultValues: z.input<ZodObject<TShape>>;
	schema: ZodObject<TShape>;
};

// ---------------------------------------------------------------------------
// Options passadas no useForm do factory
// ---------------------------------------------------------------------------
export type UseFormFactoryOptions<TShape extends ZodRawShape> = {
	defaultValues?: Partial<z.input<ZodObject<TShape>>>;
	onSubmit: (values: z.output<ZodObject<TShape>>) => Promise<void> | void;
};

// ---------------------------------------------------------------------------
// Props do Field — name é tipado pelas keys do schema
// ---------------------------------------------------------------------------
export type FormFieldProps<TShape extends ZodRawShape> = {
	autoComplete?: string;
	children?: (field: AnyFieldApi) => ReactNode;
	className?: string;
	description?: ReactNode;
	disabled?: boolean;
	label?: string;
	leftSection?: ReactNode;
	mask?: Mask | MaskPreset;
	maskOptions?: Options;
	name: Extract<keyof z.input<ZodObject<TShape>>, string>;
	options?: SelectOption[];
	placeholder?: string;
	rightSection?: ReactNode;
	type?: FieldType;
};

// ---------------------------------------------------------------------------
// Props internas do componente de renderização de campo
// ---------------------------------------------------------------------------
export type FormFieldRendererProps = {
	autoComplete?: string;
	className?: string;
	description?: ReactNode;
	disabled?: boolean;
	field: AnyFieldApi;
	label?: string;
	leftSection?: ReactNode;
	mask?: Mask | MaskPreset;
	maskOptions?: Options;
	options?: SelectOption[];
	placeholder?: string;
	rightSection?: ReactNode;
	type?: FieldType;
};

// -----------------------------------------------------------------------
// Props do Submit
// ---------------------------------------------------------------------------
export type SubmitProps = {
	children?:
		| ReactNode
		| ((state: { isSubmitting: boolean; canSubmit: boolean }) => ReactNode);
	className?: string;
	size?:
		| "default"
		| "xs"
		| "sm"
		| "lg"
		| "icon"
		| "icon-xs"
		| "icon-sm"
		| "icon-lg";
};

// ---------------------------------------------------------------------------
// Props do Form wrapper
// ---------------------------------------------------------------------------
export type FormWrapperProps = {
	children: ReactNode;
	className?: string;
};
