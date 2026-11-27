# 05 — Undo/redo fixes for segments

**Type:** bug fixes · **Depends on:** nothing (03 changes `menu.ts` nearby, so a context conflict there is harmless)

## What & why
Three fixes to segment undo/redo:
1. **Undo stopped working once history was full.** react-use's `useStateWithHistory` puts its position one past the last entry once capacity (100) is reached, so the first undo after every edit did nothing. It's replaced with our own pure history implementation.
   Also, **dragging a segment on the timeline is one undo step**, not one per mouse move.
2. **Selecting segments is not an edit.** Selection changes update the current history entry instead of adding an undo step, so Ctrl+Z undoes the last real change.
3. **Edit menu → Undo/Redo undo segments.** Clicked in the menu, they undo or redo segments, or the text being edited if a text field has focus. Keyboard shortcuts behave as before: the renderer handles segment undo, and the menu accelerator only does native text undo.

## How
- `src/renderer/src/util/history.ts` (new, pure):
  - `History<T> { entries, position, coalesceKey? }`, plus `createHistory`, `getCurrentState`, `pushHistory(history, state, capacity, coalesceKey?)`, `replaceCurrentHistory`, `undoHistory` and `redoHistory`.
  - `SetStateWithHistoryOptions { coalesceKey?, recordHistory? }`.
  - Pushing the same state is a no-op. Pushing with the same `coalesceKey` while at the end merges into the current entry. A push drops redo entries and trims to capacity.
  - Tests are in `util/history.test.ts`.
- `src/renderer/src/hooks/useStateWithHistory.ts` (new): returns `[state, setState(valueOrFn, options?), { back, forward, reset(state) }]`. `recordHistory: false` → `replaceCurrentHistory`.
- `hooks/useSegments.tsx`:
  - Use the new hook instead of `react-use/lib/useStateWithHistory`.
  - Thread an optional `historyOptions` through `safeSetCutSegments`, `updateSegAtIndex` and `setCutTime` (and the `UpdateSegAtIndex` type in `types.ts`).
  - All selection setters (`selectOnlySegment`, `toggleSegmentSelected`, `deselectAllSegments`, `selectAllSegments`, `invertSelectedSegments`, selecting by IDs) pass `{ recordHistory: false }`.
- `Timeline.tsx`: on mousedown, build `{ coalesceKey: \`timeline-drag-${e.timeStamp}\` }` and pass it to every `setCutTime` during that drag.
- `App.tsx`:
  - On file reset, use `cutSegmentsHistory.reset([])` instead of the `history[0] = []; go(0)` hack.
  - Add the IPC actions `menuUndo`/`menuRedo` → `menuUndoRedo(type)`. If a text field has focus, run `document.execCommand(type)`. Otherwise run `cutSegmentsHistory.back()`/`.forward()`. Add `cutSegmentsHistory` to that effect's dependency list.
- `src/main/menu.ts`: replace `{ role: 'undo' }`/`{ role: 'redo' }` with items whose `click(_, _, event)` runs `mainWindow.webContents.undo()`/`.redo()` when `event.triggeredByAccelerator`. Otherwise they send `menuUndo`/`menuRedo` to the renderer.

## Verify
- `yarn test run src/renderer/src/util/history.test.ts`, `yarn tsc`, `yarn lint`.
- Manual:
  - Make more than 100 edits, then undo: it works the first time.
  - Drag a segment, then undo once: it goes all the way back.
  - Select a segment, then undo: the last real edit is undone, not the selection.
  - Edit → Undo from the menu undoes segments.

## Drop when
If upstream stops using react-use's hook or fixes its capacity bug, re-check each of the three points. Drop the ones upstream now handles.
