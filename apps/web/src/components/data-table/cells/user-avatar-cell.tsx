"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@acme/ui/components/avatar";
import { getInitials } from "@/utils/initials";

type UserAvatarCellProps = {
	avatarUrl?: string | null;
	name: string;
};

export function UserAvatarCell({ name, avatarUrl }: UserAvatarCellProps) {
	return (
		<div className="flex items-center gap-2">
			<Avatar className="h-7 w-7">
				<AvatarImage alt={name} src={avatarUrl || undefined} />
				<AvatarFallback className="bg-primary/20 text-primary text-xs">
					{getInitials(name)}
				</AvatarFallback>
			</Avatar>
			<span className="text-foreground text-sm">{name}</span>
		</div>
	);
}
