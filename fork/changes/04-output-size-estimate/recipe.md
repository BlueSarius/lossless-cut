# 04 — Estimated total output size below "Segments total"

**Type:** feature · **Depends on:** nothing

## What & why
The segment list footer already shows "Segments total:" (summed duration of selected segments). This adds a line below it: **"Estimated output size: ~123MB"**, the sum of the per-segment size estimates.

## How
`src/renderer/src/SegmentList.tsx`:
- Add a `segmentsTotalEstimatedSize` `useMemo`. It sums `getSegEstimatedSize(seg)` over `selectedSegments` that have an `end`. If any estimate is `undefined`, the total is `undefined` and the line is hidden.
- Render it right after the "Segments total:" row, in the same row style with `fontSize: '.8em'`. Format with `prettyBytes(total, { space: false, maximumFractionDigits: 1, minimumFractionDigits: 0 })` prefixed with `~`.
- Upstream already has `getSegEstimatedSize` and the `Estimated output size:` translation key. If either was renamed or removed, find the equivalent and adapt.

## Verify
`yarn tsc`, `yarn lint`. Manual: load a file and make 2 segments. The footer shows an estimated size that changes when segments are selected or deselected.

## Drop when
Upstream shows a total estimated size itself.
