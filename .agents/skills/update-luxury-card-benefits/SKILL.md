---
name: update-luxury-card-benefits
description: Update and verify this repository's Luxury Card benefit YAML files from the official member website. Use when asked to refresh, synchronize, audit, add, remove, or correct Cafe Hour, Lounge Hour, Luxury Limousine, Luxury Upgrade, or Luxury Dining venue data under data. Use curl for public official-page collection and Browser to verify changes or content that curl cannot retrieve completely.
---

# Update Luxury Card Benefits

Use the official member website only. For public pages, use `curl` as the
primary collection and comparison surface. Do not use web search, unofficial
benefits sites, or other sources.

Use Browser to verify changed records and any content that is not complete in
the `curl` response (such as JavaScript-rendered lists, accordions, pagination,
or lazy-loaded venues). If a page requires authentication, ask the user to sign
in within Browser and do not use another source to bypass authentication.

## Source pages

Fetch these pages with `curl`; open the relevant page in Browser when
verification is required:

- Cafe Hour: `https://www.member.myluxurycard.co.jp/serviceinfo/dining/cafe`
- Lounge Hour: `https://www.member.myluxurycard.co.jp/serviceinfo/dining/bar`
- Luxury Limousine: `https://www.member.myluxurycard.co.jp/serviceinfo/dining/limousine`
- Luxury Upgrade: `https://www.member.myluxurycard.co.jp/serviceinfo/dining/luxuryupgrade`
- Luxury Dining: `https://www.member.myluxurycard.co.jp/serviceinfo/dining/luxurydining`

## Workflow

1. Resolve the repository root and inspect the current files under
   `data/` before browsing.
2. Fetch each requested official category page with `curl`, following redirects
   and failing on HTTP errors. Confirm the returned HTML contains the expected
   category listing and venue detail links before using it as the source.
3. Compare the collected official data with the category YAML by normalized
   venue name and area. Identify new, removed, and field-level changes.
4. Read the Browser control skill completely and use Browser when either of the
   following applies:
   - `curl` did not return the complete category listing or detail content.
   - A record is new, removed, or has changed benefit, availability, location,
     URL, address, or important notice.

   In Browser, expand accordions, pagination, filters, or “load more” controls
   and scroll through lazy-loaded lists until the relevant records are visible.
   If the official page requires authentication, ask the user to sign in and
   continue only after they confirm it is ready.
5. For every added or changed venue, capture only:
   - venue name
   - area
   - prefecture
   - region
   - benefit content
   - benefit application time
   - the venue's official detail URL from the category listing
   - address when the official page provides one
   - important temporary notice
6. Add new venues and update verified fields. Never delete an existing venue
   merely because its benefit ended:
   - Set `active: false` when the official page clearly shows that a benefit
     ended or the venue is no longer eligible.
   - Preserve its last known benefit, hours, location, official detail URL, and
     notice.
   - Set `active: true` for a new or reactivated benefit.
   - Keep the existing flag and report the ambiguity when status is unclear.
7. Set `last_checked` to the current local date only for a category that was
   fully reviewed.
8. Edit files with `apply_patch`; keep unrelated user changes intact.
9. Validate the Astro static site:

   ```bash
   npm install
   npm run check
   npm test
   npm run build
   ```

   Confirm that all five YAML files load, inactive venues are absent from the
   generated `dist/index.html`, and the build remains fully static.
10. Update Google My Maps only when the venue roster or location changed:
    - Benefit details changed: update YAML only. My Maps normally needs no
      change.
    - New venue: add it to YAML, search for the venue in the single shared
      Google My Map, choose "地図に追加", and set its category marker style if
      needed.
    - Ended venue: retain it in YAML with `active: false`, then manually remove
      or hide its marker in My Maps.
    - Moved venue: update YAML area and address as needed, then manually update
      the marker in My Maps.
    - Never change Google My Maps without an explicit user request, even when
      Browser control is available.
11. Report the categories fetched with `curl`, the records verified in Browser,
    which category files changed, whether a manual My Maps change is needed,
    any ambiguous official information, and the validation results.
    Remind the user to restart a running Astro development server after asset
    changes.

## File mapping

| Category | File | `category` |
| --- | --- | --- |
| Cafe Hour | `data/cafe_hour.yaml` | `cafe` |
| Lounge Hour | `data/lounge_hour.yaml` | `lounge` |
| Luxury Limousine | `data/luxury_limousine.yaml` | `limousine` |
| Luxury Upgrade | `data/luxury_upgrade.yaml` | `upgrade` |
| Luxury Dining | `data/luxury_dining.yaml` | `dining` |

## YAML contract

Keep this structure:

```yaml
title: ラグジュアリーダイニング
category: dining
last_checked: YYYY-MM-DD
source: https://www.member.myluxurycard.co.jp/...
venues:
  - active: true
    name: 店舗名
    area: エリア
    prefecture: 都道府県
    region: 地域区分
    benefit: 優待内容
    hours: 優待適用時間
    official_url: https://www.member.myluxurycard.co.jp/diningdetail/...
    address: 住所
    notice: 期間限定の重要なお知らせ
```

`official_url`, `address`, and `notice` are optional. Record `official_url` only
when the exact venue link is present on an official category page; never infer
or fabricate it. Every other venue field, including the boolean `active`, is
required. The app displays only records with `active: true`; inactive records
remain in YAML as history.
Do not add `description`, `benefit_examples`, target-store counts, promotional
copy, menu descriptions unrelated to the benefit, or inferred conditions.

Use concise Japanese while preserving prices, eligible card tiers, frequency,
reservation deadlines, excluded days, and other conditions that affect use.
When official wording is unclear, keep the existing value and report the
ambiguity instead of guessing.
