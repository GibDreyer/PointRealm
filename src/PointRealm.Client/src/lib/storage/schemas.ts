import { z } from 'zod';

export const ProfileSchema = z.object({
  schemaVersion: z.literal(1),
  lastDisplayName: z.string(),
  preferredThemeKey: z.string().optional(),
  updatedAt: z.string().datetime(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const RecentRealmItemSchema = z.object({
  realmCode: z.string(),
  realmName: z.string().optional(),
  joinUrl: z.string().optional(),
  themeKey: z.string().optional(),
  role: z.enum(['participant', 'observer']).optional(),
  displayNameUsed: z.string(),
  lastVisitedAt: z.string().datetime(),
});

export type RecentRealmItem = z.infer<typeof RecentRealmItemSchema>;

export const RecentRealmsSchema = z.object({
  schemaVersion: z.literal(1),
  items: z.array(RecentRealmItemSchema),
});

export type RecentRealms = z.infer<typeof RecentRealmsSchema>;
