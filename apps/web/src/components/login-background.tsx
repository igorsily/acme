"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const LIGHT_BACKGROUND = "/assets/background.webp";
const DARK_BACKGROUND = "/assets/background-dark.webp";

export function LoginBackground() {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const src =
		mounted && resolvedTheme === "dark" ? DARK_BACKGROUND : LIGHT_BACKGROUND;

	return (
		<div
			aria-hidden
			className="pointer-events-none absolute inset-0 -z-10 bg-muted"
		>
			<Image
				alt=""
				className="object-cover object-center"
				fill
				priority
				sizes="100vw"
				src={src}
				suppressHydrationWarning
			/>
		</div>
	);
}
