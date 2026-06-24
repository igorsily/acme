"use client";

import { Input } from "@acme/ui/components/input";
import { type MaskPreset, resolveMask } from "@acme/ui/lib/masks";
import { cn } from "@acme/ui/lib/utils";
import type { ComponentProps } from "react";
import { type Mask, type Options, useMaskInput } from "use-mask-input";

type MaskedInputProps = Omit<ComponentProps<"input">, "ref"> & {
	mask: Mask | MaskPreset;
	maskOptions?: Options;
};

function MaskedInput({
	mask,
	maskOptions,
	className,
	...props
}: MaskedInputProps) {
	const maskRef = useMaskInput({
		mask: resolveMask(mask),
		options: { autoUnmask: true, ...maskOptions },
	});

	return <Input className={className} ref={maskRef} {...props} />;
}

function MaskedInputGroupInput({
	mask,
	maskOptions,
	className,
	...props
}: MaskedInputProps) {
	const maskRef = useMaskInput({
		mask: resolveMask(mask),
		options: { autoUnmask: true, ...maskOptions },
	});

	return (
		<Input
			className={cn(
				"flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
				className
			)}
			data-slot="input-group-control"
			ref={maskRef}
			{...props}
		/>
	);
}

export { MaskedInput, MaskedInputGroupInput };
export type { MaskedInputProps };
