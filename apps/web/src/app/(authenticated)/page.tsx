import { Card, CardContent } from "@acme/ui/components/card";

export default function HomePage() {
	return (
		<section className="flex min-h-[calc(100vh-7rem)] flex-col">
			<Card className="min-h-64 flex-1">
				<CardContent className="h-full min-h-64" />
			</Card>
		</section>
	);
}
