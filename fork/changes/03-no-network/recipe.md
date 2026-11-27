# 03 — No outbound network connections

**Type:** preference (privacy) · **Depends on:** nothing · **Conflict hotspot:** touches many files. Expect to rebuild it from this recipe instead of applying the patch.

## What & why
The app must make **no network connections on its own**. Networking is **off by default**. The user can opt in with `--enable-networking`. `--disable-networking` still works and wins over `--enable-networking`.

## How (checklist — re-do each item on fresh upstream)
1. **Update checker:** delete `src/main/updateChecker.ts` (the GitHub API, `@octokit/core`) and remove:
   - the `checkNewVersion` call and the `newVersion` variable in `src/main/index.ts`;
   - the "New version!" menu and the `newVersion` param in `src/main/menu.ts`;
   - the `enableUpdateCheck` config key (`src/common/types.ts`, `src/main/configStore.ts`), its setting toggle (`Settings.tsx`) and `useUserSettingsRoot.ts`.
2. **Start screen banner:** remove `loadMifiLink` (fetches `losslesscut.mifi.no/config.json`) from `src/renderer/src/mifi.ts`. Remove the `mifiLink` state and effect from `App.tsx` (and the now-unused `hasDisabledNetworking`/`isStoreBuild` imports), and the iframe banner and its `mifiLink`/`darkMode` props from `NoFileLoaded.tsx`. Drop the `ky` import there if nothing else uses it.
3. **Analytics:** remove `checkAppPath()` from `src/renderer/src/dialogs/index.tsx`, along with its caller. It reported store-build app path/title to `losslesscut-analytics.mifi.no` and is purposely obfuscated, so search for `checkAppPath` and `anal`.
4. **GPS map:** delete `components/GpsMap.tsx` (OpenStreetMap tiles). Remove:
   - its use in `StreamsSelector.tsx`;
   - the GPS track helpers: `extractSrtGpsTrack` in `ffmpeg.ts`, `parseSrt`/the DJI GPS parsers in `edlFormats.ts` plus their tests and snapshot, and `isGpsStream` in `util/streams.ts`.

   Then remove these dependencies from `package.json`: `leaflet`, `react-leaflet`, `@types/leaflet`, `@adamscybot/react-leaflet-component-marker`, `@octokit/core`. Also remove the `Hippocratic-2.1` react-leaflet entry from `script/checkLicenses.ts`.
5. **Networking off by default:**
   - `src/main/networking.ts`: `let disableNetworking = true;`
   - `src/main/index.ts`: yargs `boolean: ['disable-networking', 'enable-networking']`, then `setDisableNetworking(!argv['enableNetworking'] || !!argv['disableNetworking'])`.
   - `docs/cli.md`: document `--enable-networking`, and note that `--disable-networking` is now the default.
6. **Bug-report links:** remove the "report a bug", discussions/Discord and support-email links from the problem report dialog (`reporting.tsx`), and the `discussionsUrl`, `publicBugReportUrl` and `supportEmail` constants (`src/common/constants.ts`). Keep the error-details dialog itself.
7. Run `yarn install` to regenerate `yarn.lock` (the patch leaves `yarn.lock` out on purpose), then `yarn scan-i18n` to drop removed strings.

## New-upstream check (important)
After rebuilding, **search the new upstream for any new network use** and remove it too, then add it to this checklist:
```bash
grep -rnE "fetch\(|ky\(|ky\.|https?://|net\.request|axios|got\(|WebSocket|<iframe" src --include=*.ts --include=*.tsx | grep -v "\.test\."
```
Links the user opens on purpose (help/FAQ/homepage menu items going through `openExternal`) are fine. They're blocked anyway while networking is disabled.

## Verify
- `yarn tsc`, `yarn lint`, `yarn test run`.
- No `updateChecker`, `loadMifiLink`, `GpsMap`, `leaflet` or `octokit` left (`grep -rn`).
- Manual: start the app with no flags. The start screen has no banner and there's no update menu.

## Drop when
Never.
