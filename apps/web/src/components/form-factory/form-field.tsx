"use client";

import { Checkbox } from "@acme/ui/components/checkbox";
import {
	FieldContent,
	FieldDescription,
	FieldLabel,
	Field as UiField,
} from "@acme/ui/components/field";
import { Input } from "@acme/ui/components/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@acme/ui/components/input-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@acme/ui/components/select";
import { Textarea } from "@acme/ui/components/textarea";
import { resolveMask } from "@acme/ui/lib/masks";
import type { ChangeEvent, ReactNode } from "react";
import { useTanStackFormMask } from "use-mask-input";

import type { FormFieldRendererProps } from "./form-factory.types";
import { FieldInfo } from "./form-field-info";

function getIsInvalid(field: FormFieldRendererProps["field"]) {
	return field.state.meta.isTouched && !field.state.meta.isValid;
}

type TextInputCommonProps = {
	"aria-invalid": boolean;
	autoComplete?: string;
	disabled?: boolean;
	id: string;
	placeholder?: string;
};

function renderInputGroup(
	leftSection: FormFieldRendererProps["leftSection"],
	rightSection: FormFieldRendererProps["rightSection"],
	input: ReactNode
) {
	return (
		<InputGroup>
			{leftSection && (
				<InputGroupAddon align="inline-start">{leftSection}</InputGroupAddon>
			)}
			{input}
			{rightSection && (
				<InputGroupAddon align="inline-end">{rightSection}</InputGroupAddon>
			)}
		</InputGroup>
	);
}

function renderMaskedTextInput({
	field,
	mask,
	maskOptions,
	maskField,
	commonProps,
	leftSection,
	rightSection,
}: {
	field: FormFieldRendererProps["field"];
	mask: NonNullable<FormFieldRendererProps["mask"]>;
	maskOptions?: FormFieldRendererProps["maskOptions"];
	maskField: ReturnType<typeof useTanStackFormMask>;
	commonProps: TextInputCommonProps;
	leftSection?: FormFieldRendererProps["leftSection"];
	rightSection?: FormFieldRendererProps["rightSection"];
}) {
	const maskedProps = maskField(
		resolveMask(mask),
		{
			name: field.name,
			value: (field.state.value as string) ?? "",
			onBlur: field.handleBlur,
			onChange: (event: ChangeEvent<HTMLInputElement>) => {
				field.handleChange(event.target.value);
			},
		},
		{ autoUnmask: true, ...maskOptions }
	);

	const maskedInputProps = { ...maskedProps, ...commonProps };
	const input = <Input {...maskedInputProps} />;

	if (leftSection || rightSection) {
		return renderInputGroup(
			leftSection,
			rightSection,
			<InputGroupInput {...maskedInputProps} />
		);
	}

	return input;
}

function renderPlainTextInput({
	field,
	type,
	commonProps,
	leftSection,
	rightSection,
}: {
	field: FormFieldRendererProps["field"];
	type: FormFieldRendererProps["type"];
	commonProps: TextInputCommonProps;
	leftSection?: FormFieldRendererProps["leftSection"];
	rightSection?: FormFieldRendererProps["rightSection"];
}) {
	const inputProps = {
		...commonProps,
		name: field.name,
		onBlur: field.handleBlur,
		onChange: (event: ChangeEvent<HTMLInputElement>) => {
			const rawValue = event.target.value;

			if (type === "number") {
				field.handleChange(rawValue === "" ? undefined : Number(rawValue));
				return;
			}

			field.handleChange(rawValue);
		},
		type,
		value: (field.state.value as string | number | undefined) ?? "",
	};

	if (leftSection || rightSection) {
		return renderInputGroup(
			leftSection,
			rightSection,
			<InputGroupInput {...inputProps} />
		);
	}

	return <Input {...inputProps} />;
}

/**
 * Renderiza o componente de input correto baseado no type.
 */
function FieldInput({
	field,
	autoComplete,
	type = "text",
	placeholder,
	disabled,
	label,
	description,
	options,
	leftSection,
	rightSection,
	className,
	mask,
	maskOptions,
}: Pick<
	FormFieldRendererProps,
	| "field"
	| "autoComplete"
	| "className"
	| "type"
	| "placeholder"
	| "disabled"
	| "label"
	| "description"
	| "options"
	| "leftSection"
	| "rightSection"
	| "mask"
	| "maskOptions"
>) {
	const isInvalid = getIsInvalid(field);
	const maskField = useTanStackFormMask();

	if (type === "checkbox") {
		return (
			<UiField
				className={className}
				data-disabled={disabled ? true : undefined}
				data-invalid={isInvalid ? true : undefined}
				orientation="horizontal"
			>
				<Checkbox
					aria-invalid={isInvalid}
					checked={field.state.value as boolean}
					disabled={disabled}
					id={field.name}
					onCheckedChange={(checked: boolean) => {
						field.handleChange(checked);
					}}
				/>
				<FieldContent>
					{label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
					{description && <FieldDescription>{description}</FieldDescription>}
					<FieldInfo field={field} />
				</FieldContent>
			</UiField>
		);
	}

	if (type === "textarea") {
		return (
			<Textarea
				aria-invalid={isInvalid}
				autoComplete={autoComplete}
				disabled={disabled}
				id={field.name}
				name={field.name}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				placeholder={placeholder}
				value={(field.state.value as string) ?? ""}
			/>
		);
	}

	if (type === "select") {
		const selectedValue = (field.state.value as string) || null;

		return (
			<Select
				disabled={disabled}
				items={options}
				onValueChange={(value) => field.handleChange(value ?? "")}
				value={selectedValue}
			>
				<SelectTrigger
					aria-invalid={isInvalid}
					className="w-full"
					id={field.name}
					onBlur={field.handleBlur}
				>
					<SelectValue placeholder={placeholder ?? "Selecione..."} />
				</SelectTrigger>

				<SelectContent>
					<SelectGroup>
						{options?.map((option) => (
							<SelectItem
								key={option.value}
								label={option.label}
								value={option.value}
							>
								{option.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		);
	}

	const commonProps: TextInputCommonProps = {
		"aria-invalid": isInvalid,
		autoComplete,
		disabled,
		id: field.name,
		placeholder,
	};

	if (mask) {
		return renderMaskedTextInput({
			commonProps,
			field,
			leftSection,
			mask,
			maskField,
			maskOptions,
			rightSection,
		});
	}

	return renderPlainTextInput({
		commonProps,
		field,
		leftSection,
		rightSection,
		type,
	});
}

/**
 * Renderiza um campo de formulário com Label, Input correto e mensagens de erro.
 * Usado internamente pelo FormFactory quando não há render customizado.
 */
export function FormFieldRenderer({
	field,
	autoComplete,
	label,
	description,
	type = "text",
	placeholder,
	disabled,
	className,
	options,
	leftSection,
	rightSection,
	mask,
	maskOptions,
}: FormFieldRendererProps) {
	if (type === "checkbox") {
		return (
			<FieldInput
				autoComplete={autoComplete}
				className={className}
				description={description}
				disabled={disabled}
				field={field}
				label={label}
				leftSection={leftSection}
				mask={mask}
				maskOptions={maskOptions}
				options={options}
				placeholder={placeholder}
				rightSection={rightSection}
				type={type}
			/>
		);
	}

	const isInvalid = getIsInvalid(field);

	return (
		<UiField
			className={className}
			data-disabled={disabled ? true : undefined}
			data-invalid={isInvalid ? true : undefined}
		>
			{label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}

			<FieldInput
				autoComplete={autoComplete}
				description={description}
				disabled={disabled}
				field={field}
				label={label}
				leftSection={leftSection}
				mask={mask}
				maskOptions={maskOptions}
				options={options}
				placeholder={placeholder}
				rightSection={rightSection}
				type={type}
			/>

			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldInfo field={field} />
		</UiField>
	);
}
