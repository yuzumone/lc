import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  activeVenues,
  categoryKeys,
  loadBenefitCollections,
} from "../src/lib/benefits";
import { parseState, stateUrl } from "../src/lib/state";

const temporaryDirectories: string[] = [];

function fixtureDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "lc-benefits-"));
  temporaryDirectories.push(directory);
  for (const category of categoryKeys) {
    const filenames = {
      cafe: "cafe_hour.yaml",
      lounge: "lounge_hour.yaml",
      dining: "luxury_dining.yaml",
      limousine: "luxury_limousine.yaml",
      upgrade: "luxury_upgrade.yaml",
    };
    fs.writeFileSync(
      path.join(directory, filenames[category]),
      [
        `title: ${category}`,
        `category: ${category}`,
        "last_checked: 2026-07-26",
        `source: https://example.com/${category}`,
        "venues:",
        "  - active: true",
        `    name: ${category} active`,
        "    area: 東京",
        "    prefecture: 東京都",
        "    region: 関東",
        "    benefit: 優待",
        "    hours: 条件",
        `    official_url: https://www.member.myluxurycard.co.jp/diningdetail/${category}-active`,
        "  - active: false",
        `    name: ${category} inactive`,
        "    area: 東京",
        "    prefecture: 東京都",
        "    region: 関東",
        "    benefit: 終了",
        "    hours: 条件",
      ].join("\n"),
    );
  }
  return directory;
}

afterEach(() => {
  temporaryDirectories.splice(0).forEach((directory) => {
    fs.rmSync(directory, { recursive: true, force: true });
  });
});

describe("benefit data", () => {
  it("loads all five YAML categories and filters inactive venues", () => {
    const collections = loadBenefitCollections(fixtureDirectory());
    expect(collections.map((collection) => collection.category)).toEqual(
      categoryKeys,
    );
    collections.forEach((collection) => {
      expect(activeVenues(collection)).toHaveLength(1);
      expect(activeVenues(collection)[0].name).toContain("active");
      expect(activeVenues(collection)[0].name).not.toContain("inactive");
      expect(activeVenues(collection)[0].officialUrl).toContain(
        "/diningdetail/",
      );
    });
  });

  it("keeps category definitions independent from the shared map", () => {
    const collections = loadBenefitCollections(fixtureDirectory());
    expect(collections.map(({ definition }) => definition.key)).toEqual(
      categoryKeys,
    );
    expect(
      collections.every(({ definition }) => !("mapUrl" in definition)),
    ).toBe(true);
  });
});

describe("URL state", () => {
  it("restores valid category and view values", () => {
    expect(parseState("?category=upgrade&view=map")).toEqual({
      category: "upgrade",
      view: "map",
    });
  });

  it("falls back safely and serializes state", () => {
    expect(parseState("?category=unknown&view=other")).toEqual({
      category: "cafe",
      view: "list",
    });
    expect(
      stateUrl(
        { category: "lounge", view: "map" },
        "https://example.com/?foo=bar",
      ),
    ).toBe("/?foo=bar&category=lounge&view=map");
  });
});
