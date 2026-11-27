# 01 — Fork-owned files

**Type:** infrastructure · **Always applied first** · **No patch:** these files are copied as-is.

## What & why
Files that exist only in this fork and that upstream doesn't have:

| Path | Purpose |
|---|---|
| `fork/` | This patch store: the list of changes, recipes, patches and the sync procedure. |
| `CLAUDE.md` | Tells Claude never to interact with upstream, and points to `fork/SYNC.md`. |
| `.github/workflows/build-windows.yml` | A Windows x64 build you start manually ("Build Windows release" → Run workflow). It builds a `7z` and publishes a GitHub Release tagged `v<version>-win.<run>`. |

## How
Copy them from the old `master`, without changing them:
```bash
git checkout <old-master> -- fork CLAUDE.md .github/workflows/build-windows.yml
```

## Verify
- The files exist with the same content as on the old `master`.
- If upstream's own build workflows changed, check that `build-windows.yml` still matches upstream's Windows steps: Node version, `yarn download-ffmpeg-win32-x64`, and the `electron-builder` flags. Upstream's `.github/workflows/build.yml` is the reference.

## Conflicts / when to revisit
- If upstream ever adds its own `CLAUDE.md`, merge the two: keep upstream's content and put the fork rules at the top.
- If upstream renames the ffmpeg download script or changes the `dist/` artifact name, update `build-windows.yml`.
