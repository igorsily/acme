import { preload } from "react-dom";

export default function LoginLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	preload("/assets/background.webp", { as: "image" });
	preload("/assets/background-dark.webp", { as: "image" });

	return children;
}
