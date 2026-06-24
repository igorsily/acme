const NAME_SEPARATOR_REGEX = /\s+/;

export function getInitials(name?: string | null): string {
	const parts = name?.trim().split(NAME_SEPARATOR_REGEX).filter(Boolean);

	if (!parts?.length) {
		return "U";
	}

	return (
		(parts[0]?.charAt(0) ?? "") +
		(parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : "")
	).toUpperCase();
}
