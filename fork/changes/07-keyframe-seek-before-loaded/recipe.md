# 07 — Don't jump far away when seeking prev/next keyframe before keyframes are loaded

**Type:** bug fix · **Depends on:** nothing

## What & why
After jumping to a new location, the keyframes around it are read after a 500 ms debounce plus an ffprobe run. Until then, "seek to previous/next keyframe" searched the whole keyframe cache and could jump to a keyframe from an earlier, far-away location.

Now the app tracks **which time ranges have actually been read**. It only seeks to a keyframe if the whole range between the current position and that keyframe has been read. Otherwise it stays put.

Also fixed: if a keyframe read was in progress when the user seeked, the read for the new location was skipped and the in-progress result thrown away, so keyframes at the new location might never load. **Reads are now queued.**

## How
- New `src/renderer/src/util/keyframes.ts`: `ScannedInterval { from, to, createdAt }` and `isRangeScanned(intervals, from, to)`. It returns true if the union of the intervals covers `[from, to]` (tests in `keyframes.test.ts`).
- `ffmpeg.ts`: export `getIntervalAroundTime`.
- `hooks/useKeyframes.ts`:
  - Record each read window (`getIntervalAroundTime(commandedTime, ffmpegExtractWindow)`) as a scanned interval once its read finishes. Clear them when the file or stream changes.
  - Queue reads instead of skipping them while one is running.
  - Expose `findNearestKnownKeyFrameTime({ fromTime, time, direction })`. It works like `findNearestKeyFrameTime`, but returns `undefined` unless `isRangeScanned(intervals, fromTime, result)`.
- `App.tsx` `seekClosestKeyframe`: use `findNearestKnownKeyFrameTime({ fromTime: currentTime, time: currentTime + direction * sigma, direction })`. Return early (don't seek) if it gives `undefined`.

## Verify
- `yarn test run src/renderer/src/util/keyframes.test.ts`, `yarn tsc`, `yarn lint`.
- Manual: open a long video and visit the start. Jump to the middle and immediately press "next keyframe": it doesn't jump back near the start. After about 1 s it seeks correctly.

## Drop when
Upstream changes keyframe loading so the cache only covers what's around the playhead, or fixes the stale-jump problem itself. Re-test the manual step against plain upstream first.
