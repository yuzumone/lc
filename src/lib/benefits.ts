import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { CategoryKey } from "./categories";

export { categoryKeys } from "./categories";

export interface BenefitVenue {
  active: boolean;
  name: string;
  area: string;
  prefecture: string;
  region: string;
  benefit: string;
  hours: string;
  officialUrl?: string;
  notice?: string;
}

export interface BenefitCollection {
  title: string;
  category: CategoryKey;
  lastChecked: string;
  source: string;
  venues: BenefitVenue[];
}

export interface CategoryDefinition {
  key: CategoryKey;
  label: string;
  shortLabel: string;
  file: string;
}

const definitions = [
  {
    key: "cafe",
    label: "カフェアワー",
    shortLabel: "カフェ",
    file: "cafe_hour.yaml",
  },
  {
    key: "lounge",
    label: "ラウンジアワー",
    shortLabel: "ラウンジ",
    file: "lounge_hour.yaml",
  },
  {
    key: "dining",
    label: "ラグジュアリーダイニング",
    shortLabel: "ダイニング",
    file: "luxury_dining.yaml",
  },
  {
    key: "limousine",
    label: "ラグジュアリーリムジン",
    shortLabel: "リムジン",
    file: "luxury_limousine.yaml",
  },
  {
    key: "upgrade",
    label: "ラグジュアリーアップグレード",
    shortLabel: "アップグレード",
    file: "luxury_upgrade.yaml",
  },
] as const;

const defaultDataDirectory = fileURLToPath(
  new URL("../../data/", import.meta.url),
);

function requiredString(
  value: unknown,
  field: string,
  sourceFile: string,
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${sourceFile}: ${field} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim();
}

function optionalOfficialUrl(
  value: unknown,
  field: string,
  sourceFile: string,
): string | undefined {
  const urlValue = optionalString(value);
  if (!urlValue) return undefined;

  const url = new URL(urlValue);
  if (
    url.origin !== "https://www.member.myluxurycard.co.jp" ||
    !url.pathname.startsWith("/diningdetail/")
  ) {
    throw new Error(`${sourceFile}: ${field} must be an official detail URL`);
  }
  return url.toString();
}

export function loadBenefitCollections(
  dataDirectory = defaultDataDirectory,
): Array<BenefitCollection & { definition: CategoryDefinition }> {
  return definitions.map((definition) => {
    const sourceFile = path.join(dataDirectory, definition.file);
    const document = parse(fs.readFileSync(sourceFile, "utf8")) as Record<
      string,
      unknown
    >;
    if (document.category !== definition.key) {
      throw new Error(
        `${sourceFile}: expected category ${definition.key}, got ${String(document.category)}`,
      );
    }
    if (!Array.isArray(document.venues)) {
      throw new Error(`${sourceFile}: venues must be an array`);
    }

    const venues = document.venues.map((rawVenue, index) => {
      const venue = rawVenue as Record<string, unknown>;
      const active = venue.active === undefined ? true : venue.active;
      if (typeof active !== "boolean") {
        throw new Error(
          `${sourceFile}: venues[${index}].active must be a boolean`,
        );
      }
      return {
        active,
        name: requiredString(venue.name, `venues[${index}].name`, sourceFile),
        area: requiredString(venue.area, `venues[${index}].area`, sourceFile),
        prefecture: requiredString(
          venue.prefecture,
          `venues[${index}].prefecture`,
          sourceFile,
        ),
        region: requiredString(
          venue.region,
          `venues[${index}].region`,
          sourceFile,
        ),
        benefit: optionalString(venue.benefit) ?? "",
        hours: optionalString(venue.hours) ?? "",
        officialUrl: optionalOfficialUrl(
          venue.official_url,
          `venues[${index}].official_url`,
          sourceFile,
        ),
        notice: optionalString(venue.notice),
      } satisfies BenefitVenue;
    });

    return {
      title: requiredString(document.title, "title", sourceFile),
      category: definition.key,
      lastChecked: String(document.last_checked ?? ""),
      source: requiredString(document.source, "source", sourceFile),
      venues,
      definition: {
        key: definition.key,
        label: definition.label,
        shortLabel: definition.shortLabel,
        file: definition.file,
      },
    };
  });
}

export function activeVenues(collection: BenefitCollection): BenefitVenue[] {
  return collection.venues.filter((venue) => venue.active);
}

export function groupByPrefecture(
  venues: BenefitVenue[],
): Array<[string, BenefitVenue[]]> {
  const grouped = new Map<string, BenefitVenue[]>();
  for (const venue of venues) {
    const current = grouped.get(venue.prefecture) ?? [];
    current.push(venue);
    grouped.set(venue.prefecture, current);
  }
  return [...grouped.entries()];
}
