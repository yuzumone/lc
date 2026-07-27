export const categoryKeys = [
  "cafe",
  "lounge",
  "dining",
  "limousine",
  "upgrade",
] as const;

export type CategoryKey = (typeof categoryKeys)[number];

export function isCategoryKey(value: string | null): value is CategoryKey {
  return value !== null && categoryKeys.includes(value as CategoryKey);
}
