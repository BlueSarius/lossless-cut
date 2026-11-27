# Fork changes — index

This fork = **upstream `mifi/lossless-cut`** + the changes listed below, re-applied on every sync.
How to sync: see [`SYNC.md`](SYNC.md). Each change has a folder in `changes/` with a `recipe.md` (what, why, how, verify, drop-when) and its `*.patch` files.

## Upstream base

| | |
|---|---|
| **Last synced upstream commit** | `70f2663a7a7c995903701acd2f616d057f4fdc2f` (upstream `master`, 2026-10-01, after v3.69.0) |
| **Synced on** | — (original fork point, no sync done yet) |

## Changes (applied in this order)

| ID | Change | Type | Depends on | Status |
|---|---|---|---|---|
| [01-fork-files](changes/01-fork-files/recipe.md) | `fork/`, `CLAUDE.md`, Windows build workflow (copied, no patch) | infra | – | active |
| [02-aurora-palette-export-info](changes/02-aurora-palette-export-info/recipe.md) | Aurora segment colours; output file table in export/merge dialog | preference | – | active |
| [03-no-network](changes/03-no-network/recipe.md) | Remove all outbound connections; networking off by default | preference | – | active |
| [04-output-size-estimate](changes/04-output-size-estimate/recipe.md) | "Estimated output size" below segments total | feature | – | active |
| [05-undo-fixes](changes/05-undo-fixes/recipe.md) | Undo works when history is full; drag = 1 step; selection not undoable; Edit menu undo | fix | – | active |
| [06-undo-z-on-any-layout](changes/06-undo-z-on-any-layout/recipe.md) | Undo/redo follow the letter Z (QWERTZ); menu shows real shortcut | preference | 05, 03 | active |
| [07-keyframe-seek-before-loaded](changes/07-keyframe-seek-before-loaded/recipe.md) | Prev/next keyframe doesn't jump to stale far-away keyframes | fix | – | active |

Status values: `active` · `needs-rework` (patch is stale; rebuild it from the recipe) · `dropped (<reason / upstream commit>)`.
To add a new change: create `changes/NN-name/recipe.md`, give its commits a `Fork-Change: NN-name` trailer, and add a row here.

## Sync log

| Date | Upstream target | Result |
|---|---|---|
| 2026-11-27 | trial only: v3.70.2 | 02, 04, 05, 07 apply cleanly. 03 conflicts (types.ts, updateChecker.ts, App.tsx, StreamsSelector.tsx, Settings.tsx, streams.ts, constants.ts, index.ts, reporting.tsx). 06 conflicts, probably only because 03 was missing. |
| 2026-11-27 | trial only: upstream master `a30b0539` | Same as above, plus 02 (colors.ts) and 07 (useKeyframes.ts) conflict. |
