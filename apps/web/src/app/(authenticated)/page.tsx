"use client";

import dynamic from "next/dynamic";

const AcmeMap = dynamic(
	() => import("@/components/acme-map").then((module) => module.AcmeMap),
	{
		ssr: false,
		loading: () => (
			<div className="flex min-h-160 items-center justify-center rounded-lg border bg-muted text-muted-foreground text-sm">
				Carregando mapa...
			</div>
		),
	}
);

export default function HomePage() {
	return (
		<section className="flex min-h-[calc(100vh-7rem)] flex-col gap-4">
			<div className="flex-1">
				<AcmeMap />
			</div>
		</section>
	);
}
