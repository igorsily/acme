import { FieldError } from "@acme/ui/components/field";
import type { AnyFieldApi } from "@tanstack/react-form";

export function FieldInfo({ field }: { field: AnyFieldApi }) {
	if (!(field.state.meta.isTouched && !field.state.meta.isValid)) {
		return null;
	}

	return <FieldError errors={field.state.meta.errors} />;
}
