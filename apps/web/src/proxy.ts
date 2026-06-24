import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authClient } from "@/lib/auth-client";

const LOGIN_PATH = "/login";
const PUBLIC_PATH_PREFIXES = ["/login", "/convite"];

function isPublicPath(pathname: string) {
	return PUBLIC_PATH_PREFIXES.some(
		(publicPathPrefix) =>
			pathname === publicPathPrefix ||
			pathname.startsWith(`${publicPathPrefix}/`)
	);
}

async function hasSession(request: NextRequest) {
	const cookie = request.headers.get("cookie");

	if (!cookie) {
		return false;
	}

	try {
		const { data: session } = await authClient.getSession({
			fetchOptions: {
				headers: {
					cookie,
				},
			},
		});

		return Boolean(session?.user);
	} catch {
		return false;
	}
}

export async function proxy(request: NextRequest) {
	const { nextUrl } = request;
	const isAuthenticated = await hasSession(request);

	if (nextUrl.pathname === "/") {
		if (!isAuthenticated) {
			return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
		}

		return NextResponse.next();
	}

	if (nextUrl.pathname === LOGIN_PATH && isAuthenticated) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	if (!(isPublicPath(nextUrl.pathname) || isAuthenticated)) {
		return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!monitoring|api|_next/static|_next/image|favicon.ico|assets/.).*)",
	],
};
