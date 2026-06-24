"use client";

import { cn } from "@acme/ui/lib/utils";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type BrandLogoProps = {
	className?: string;
	height?: number;
	inverted?: boolean;
	width?: number;
};

export function BrandLogo({
	className,
	height = 40,
	inverted = false,
	width = 160,
}: BrandLogoProps) {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const useLightLogo = inverted || (mounted && resolvedTheme === "dark");

	return (
		<Image
			alt="Acme"
			className={cn("h-auto w-auto object-contain object-left", className)}
			height={height}
			priority
			src={useLightLogo ? "/assets/logo-white.png" : "/assets/logo-black.png"}
			style={{ maxHeight: height, maxWidth: width }}
			suppressHydrationWarning
			width={width}
		/>
	);
}
