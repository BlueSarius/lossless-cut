# 02 — Aurora segment palette + output file info in export dialog

**Type:** preference (look & feel) · **Depends on:** nothing

## What & why
1. **Segment colours:** replace upstream's segment colour palette with an "aurora" palette of violets, magentas, pinks and blues, plus warm coral, orange and peach accents. It has **no greens, teals or yellow-greens** (all hues are in 0–30° or 200–350°). The order is chosen so neighbouring segments get clearly different hues.
2. **Export/merge success dialog:** shows a table of the output files (file name, duration, size), with a totals row when there's more than one file.
3. Small fix: the merge success icon used invalid CSS colours (`'success'`/`'warning'`). It now uses `saveColor`/`warningColor`, the same as the export dialog.

## How
- `src/renderer/src/util/colors.ts`: replace the `colorStrings` list with:
  `#8a2be2, #ff4fa3, #3d7bff, #ff9f5a, #d36bff, #4fb8ff, #ff6b8b, #6a1bff, #ff8a5c, #82b1ff, #e040fb, #ffab91, #5b5bff, #ff85d8, #2196f3, #ff5e3a, #b388ff, #f06292, #3f51b5, #ffa07a, #7c4dff, #c51162, #9fa8ff, #ff3d6e`
  If upstream changed how colours are produced (e.g. switched to generated colours), keep their mechanism and feed it this palette.
- New component `src/renderer/src/components/OutputFilesInfo.tsx`:
  - It takes `paths: string[]` and reads each file's size (`readFileSize`) and duration (`getDuration` from `ffmpeg.ts`), 5 at a time (`p-map`). Errors are ignored and shown as `-`.
  - It shows "Loading output file info..." while reading, then a scrollable table (max 15em tall).
- `components/GenericDialog.tsx`: `openCutFinishedDialog` and `openConcatFinishedDialog` take a new `outputPaths: string[]` and render `<OutputFilesInfo paths={outputPaths} />` above the existing list.
- `App.tsx`: pass `outputPaths: exportedPaths` (export) or `[outPath]` (merge).
- `locales/en/translation.json`: new keys `File size`, `Loading output file info...`, `Output file`, `Total ({{count}} files)_one/_other`. If this file conflicts, run `yarn scan-i18n` to regenerate it instead of merging by hand.

## Verify
- `yarn tsc`, `yarn lint`.
- Manual: segments on the timeline show only purple, pink, blue and orange tones. Exporting 2 or more segments shows the table with a totals row.

## Drop when
Never. This is a preference. If upstream adds its own output summary to the dialog, keep whichever is better and drop the duplicate.
