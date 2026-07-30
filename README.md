# LC Benefits

An unofficial Astro-based static site for quickly browsing eligible Luxury Card benefits in a list or on a map.

## Development

Use Node.js 22 or later.

```bash
npm install
npm run dev
```

Validation:

```bash
npm run check
npm test
npm run build
```

`npm run build` reads the YAML files at build time and generates fully static HTML in `dist/`.
The browser does not fetch YAML, and the site does not use SSR.

## Environment variables

Configure the environment using `.env.example` as a reference.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Base URL for canonical links, Open Graph metadata, and the sitemap |
| `PUBLIC_MYMAP_URL` | Google My Maps embed URL shared by all categories |
| `PUBLIC_ADSENSE_CLIENT` | AdSense client ID; the script is omitted when unset |

Set the My Maps URL using the `https://www.google.com/maps/d/embed?mid=...` format.
All categories share one map, and the same iframe is retained when switching categories.
When the variable is unset, the site shows a placeholder instead of a broken iframe.

## Benefit data

Do not delete expired benefits.
Set `active: false` to hide them from the site while retaining their records.
When updating the data, use the repository's `$update-luxury-card-benefits` skill and verify the official member pages.

- `data/cafe_hour.yaml`
- `data/lounge_hour.yaml`
- `data/luxury_dining.yaml`
- `data/luxury_limousine.yaml`
- `data/luxury_upgrade.yaml`

## License

The source code in this repository is licensed under the [MIT License](LICENSE).

Files under `data/`, Luxury Card benefit information, trademarks, and third-party content are not covered by the MIT License.
Rights to such content belong to their respective owners.

## Other

This is an unofficial site and is not affiliated with Luxury Card.
Benefits may change, so check the official member site for the latest information before using them.
