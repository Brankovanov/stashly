# Color catalogue data

## Current data and validation

The repository contains 23 JSON files under `src/data/catalogues/`. Each file
uses the same structure: catalogue metadata (`brand`, `source_file`,
`code_field`, and `count`) and a `colors` array. Each color has a code, name,
six-digit hexadecimal color, RGB channels, and CMYK values.

Run the local structural and color consistency checks with:

```sh
npm run validate:catalogues
```

The validator checks JSON parsing, required metadata, declared entry counts,
non-empty unique color codes, names, valid hex colors, and RGB channels that
match the hex value. It does not establish that a manufacturer's color values
are authoritative or that the data is licensed for redistribution.

On 2026-10-16, all 23 files passed these checks, comprising 8,099 color entries.
The files declare CSV filenames in `source_file`, but do not record source
URLs, authors, collection dates, or license/permission terms. Treat provenance
and redistribution rights as unresolved. Do not connect these data to public
user-facing catalogue selection or distribute them as an endorsed color
reference until each dataset's origin and permitted use have been established
and documented. The displayed RGB/hex values should be treated as approximate;
thread and material colors vary by dye lot, substrate, lighting, and display.

## Source, default and licensing status

- **Source (reported by the project owner, 2026-10-16):** the catalogue data
  comes from the public color charts on [Stitchmate](https://stitchmate.app/tools/anchor-color-chart)
  (for example the Anchor chart, which Stitchmate describes as matching
  Coats' published shade card). Per-file retrieval dates were not recorded.
- **Default catalogue:** `dmc`, stored in `DMC_color_chart.json`. This replaces
  the earlier `DNS` placeholder.
- **Licensing:** public availability is not a licence. A review of Stitchmate's
  terms on 2026-10-16 found no explicit grant to redistribute its chart data,
  and its terms restrict automated scraping of the service. The underlying
  values are manufacturer color information, which Stitchmate says are
  approximate on screen. Before deploying publicly, either obtain written
  permission or confirm the data's origin independently, and show an
  attribution line ("Color data from Stitchmate; values are approximate") next
  to any catalogue UI. If a rights holder objects, remove the affected files.

## Maintenance

When adding or updating a chart:

1. Record the original source, retrieval date, applicable license or written
   permission, and any required attribution before committing the data.
2. Preserve the common JSON structure and the original source reference in
   `source_file`; do not silently overwrite existing values.
3. Run `npm run validate:catalogues` and resolve any reported errors.
4. Review the dataset's redistribution terms separately; a passing structural
   check is not a licensing or accuracy review.

Catalogue preference selection, supply-form lookup, and color-match
suggestions are not implemented yet. The default catalogue is `dmc`
(`DMC_color_chart.json`).
