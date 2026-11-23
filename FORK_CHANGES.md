# Fork changes

This fork is [mifi/lossless-cut](https://github.com/mifi/lossless-cut) plus the changes listed below.

To update the fork, start from the latest upstream and apply these changes again (see "How to update" at the end).
Each change says **what** it does and **why**, so it can be redone by hand when the old code no longer applies.
The "Original commit" lines point to the commit where the change was first made, as a reference.

**Main rule: the app must make no network connections on its own.**

---

## 1. No outbound network connections

**Why:** the app must not contact anything over the internet without the user asking for it.

**What to remove:**
- **Update checker:**
  - Delete `src/main/updateChecker.ts` and its use in `src/main/index.ts` (`checkNewVersion`, the `newVersion` variable).
  - Remove the "New version!" menu in `src/main/menu.ts` (and its `newVersion` parameter, plus `getReleaseUrl` if nothing else uses it).
  - Remove the `enableUpdateCheck` setting from:
    - `src/common/types.ts`
    - `src/main/configStore.ts`
    - `src/renderer/src/hooks/useUserSettingsRoot.ts`
    - `src/renderer/src/components/Settings.tsx` (the "Check for updates on startup?" toggle)
- **Start screen banner:**
  - Remove `loadMifiLink()` from `src/renderer/src/mifi.ts` (it fetches `https://losslesscut.mifi.no/config.json`).
  - Remove the `mifiLink` state and fetch in `App.tsx`.
  - Remove the `<iframe>` banner and the `mifiLink`/`darkMode` props in `src/renderer/src/NoFileLoaded.tsx`.
- **App path reporting:**
  - Remove `checkAppPath()` from `src/renderer/src/dialogs/index.tsx` (it sent the store app path or title to `losslesscut-analytics.mifi.no`).
  - Remove its call in `src/renderer/src/BottomBar.tsx`.
- **GPS map** (loads OpenStreetMap tiles):
  - Delete `src/renderer/src/components/GpsMap.tsx`.
  - Remove the "Show GPS map" menu item in `src/renderer/src/StreamsSelector.tsx`.
  - Remove the code only the map used:
    - `isGpsStream` in `src/renderer/src/util/streams.ts`
    - `parseDjiGps1` / `parseDjiGps2` (plus their tests and snapshots) in `edlFormats.ts`
    - `extractSrtGpsTrack` in `ffmpeg.ts`
  - Remove the dependencies `leaflet`, `react-leaflet`, `@types/leaflet`, `@adamscybot/react-leaflet-component-marker`, and their `Hippocratic-2.1` entry in `script/checkLicenses.ts`.
- Remove `@octokit/core` (it was only used by the update checker).

Original commit: `6dcb1c7`

## 2. Networking off by default, no bug report / support links

**Why:** an extra safety net for change 1, plus removing links to outside support channels.

**What:**
- In `src/main/networking.ts`, start with `let disableNetworking = true;`.
- In `src/main/index.ts`, add a boolean CLI flag `enable-networking`. Networking is on only when `--enable-networking` is given and `--disable-networking` is not:
  `setDisableNetworking(!argv['enableNetworking'] || !!argv['disableNetworking']);`
- Document `--enable-networking` in `docs/cli.md`.
- `openExternal` in `src/main/index.ts` already refuses to open links while networking is disabled. Keep that check.
- In `src/renderer/src/reporting.tsx`, remove the "report a bug", GitHub discussions, Discord and support email text and links from the problem report dialog. Keep the error details part.
- Remove `discussionsUrl`, `publicBugReportUrl` and `supportEmail` from `src/common/constants.ts` if nothing else uses them.
- Regenerate the English translation keys (`locales/en/translation.json`) so the removed strings disappear.

Original commit: `0ec329a`

## 3. "Aurora" segment colours

**Why:** personal taste. No greens, teals or yellow-greens.

**What:** in `src/renderer/src/util/colors.ts`, replace the segment colour list with:

```
#8a2be2, #ff4fa3, #3d7bff, #ff9f5a, #d36bff, #4fb8ff, #ff6b8b, #6a1bff, #ff8a5c, #82b1ff, #e040fb, #ffab91, #5b5bff, #ff85d8, #2196f3, #ff5e3a, #b388ff, #f06292, #3f51b5, #ffa07a, #7c4dff, #c51162, #9fa8ff, #ff3d6e
```

All hues are between 0–30° or 200–350°. The colours are ordered so that neighbouring segments get clearly different hues.

Original commit: `ba352b6`

## 4. Output file info in the export/merge finished dialog

**Why:** to see right away what was written, without opening the folder.

**What:**
- New component `src/renderer/src/components/OutputFilesInfo.tsx`. For each output file it shows the name, duration and size, plus totals when there are several files.
- `openCutFinishedDialog` and `openConcatFinishedDialog` in `src/renderer/src/components/GenericDialog.tsx` take a new `outputPaths: string[]` and render `<OutputFilesInfo paths={outputPaths} />` above the existing list.
- `App.tsx` passes `exportedPaths` (export) or `[outPath]` (merge).
- Also fixes the merge success icon colour: it used invalid CSS values `'success'`/`'warning'`; use `saveColor`/`warningColor` instead.

Original commit: `ba352b6`

## 5. Estimated output size in the segment list

**Why:** to know roughly how big the export will be before exporting.

**What:**
- In `src/renderer/src/SegmentList.tsx`, add up `getSegEstimatedSize(seg)` over the selected segments that have an end.
- If any segment's size is unknown, show nothing.
- Otherwise show a row "Estimated output size: ~X" (using `prettyBytes`) below the segments total.

Original commit: `a7e0929`

## 6. Undo/redo fixes

**Why:** undo was unreliable.

**What:**
- **Own undo history:** replace react-use's `useStateWithHistory`. Once it reaches its capacity (100), its position ends up one past the last entry, so the first undo after every edit did nothing.
  - Pure implementation: `src/renderer/src/util/history.ts`, with tests in `history.test.ts`.
  - Hook: `src/renderer/src/hooks/useStateWithHistory.ts`.
- **Dragging a segment is one undo step:** options `coalesceKey` (merge successive updates into one step) and `recordHistory: false` (update without adding a step), used in `Timeline.tsx` and `useSegments.tsx`. Before, every mouse move while dragging was its own undo step.
- **Selecting segments is not an undo step:** selection changes use `recordHistory: false`.
- **Edit menu Undo/Redo undoes segments:**
  - In `src/main/menu.ts`, the Undo and Redo items use `click` handlers instead of `role: 'undo'`/`'redo'`.
  - When triggered by the keyboard shortcut (`event.triggeredByAccelerator`), they do native undo/redo with `webContents.undo()`/`redo()`, for text fields.
  - When clicked in the menu, they send `menuUndo`/`menuRedo` to the renderer.
  - In `App.tsx` the renderer handles these: it undoes the text if a text field is focused, otherwise the segment history.
- **Undo/redo shortcuts follow the letter Z on any keyboard layout:** default shortcuts use the physical key position (US layout), so on a German (QWERTZ) keyboard undo was Ctrl + the key labelled Y.
  - When the keyboard layout is known, move the default undo/redo bindings to the key with the letter Z. Bindings the user has changed are left alone.
  - `src/renderer/src/util/keyBindings.ts`: `localizeUndoRedoKeyBindings`, `getUndoRedoAccelerators`; tests in `keyBindings.test.ts`.
  - The renderer sends the real undo/redo keys to the main process (`setUndoRedoAccelerators` IPC, checked with zod). The Edit menu displays them; on Windows/Linux they are display-only (`registerAccelerator: false`).
  - Upstream has since documented that default shortcuts follow physical key positions. Check that this change still fits upstream's approach.

Original commits: `e11cabe`, `95aa792`, `9de0885`, `d38a574`

## 7. Manual Windows x64 build workflow

**Why:** to build a Windows version of this fork without upstream's whole release setup.

**What:** `.github/workflows/build-windows.yml`, started by hand from the GitHub Actions tab. It:
- installs dependencies,
- downloads ffmpeg for win32-x64,
- runs `yarn build`,
- runs `electron-builder --win 7z --x64`,
- publishes `dist/LosslessCut-win-x64.7z` as a GitHub Release tagged `v<version>-win.<run number>`.

Upstream may rename the ffmpeg download step (they replaced the shell scripts with a TypeScript script). Check the `download-ffmpeg-*` script names in `package.json` and update the workflow to match.

Original commit: `e0050a9`

---

## How to update

1. **Save the current state:** tag the current fork, e.g. `fork-YYYY-MM-DD`, so the old code can always be found.
2. **Start fresh:** create a new branch from the latest `upstream/master`.
3. **Apply the changes again**, one commit per change above, in this order: 1, 2, 3, 4, 5, 6, 7. For each, either cherry-pick the previous version of the commit or, if that conflicts badly, redo it from the description.
4. **Network check** of the result. Search `src/` for:
   - `fetch(`, `ky(`, `ky.`, `net.request`, `http.get`, `https.get`, `<iframe`, `new WebSocket`, `EventSource`, `navigator.sendBeacon`, `api.github.com`, `mifi.no`, `losslesscut.app`
   - any new uses of `openExternal`

   Remove any automatic connection that upstream has added. Links the user clicks are allowed only while networking is enabled. Also check `package.json` for new network libraries.
5. **Check upstream's new links** (Help menu, dialogs). Remove any new bug report, Discord or support links in the spirit of change 2.
6. Run type-check, lint and tests (`yarn tsc`, `yarn lint`, `yarn test`, or whatever the scripts are called at that point).
7. Update this file: new commit ids, new file paths, and any new changes.
8. Replace the fork's main branch with the result (this rewrites its history).
