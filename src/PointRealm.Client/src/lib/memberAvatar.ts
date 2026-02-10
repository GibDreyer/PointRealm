interface AvatarLikeMember {
  name?: string | null;
  displayName?: string | null;
  avatarEmoji?: string | null;
  profileEmoji?: string | null;
  profileImageUrl?: string | null;
}

export function resolveMemberAvatar(member: AvatarLikeMember) {
  const imageUrl = member.profileImageUrl?.trim() || null;
  const emoji = member.avatarEmoji?.trim() ?? member.profileEmoji?.trim() ?? null;
  const baseName = member.name ?? member.displayName ?? '';
  const initials = getMemberInitials(baseName);

  return { imageUrl, emoji, initials };
}

export function getMemberInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '??';
  return trimmed.slice(0, 2).toUpperCase();
}
