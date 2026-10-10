import color from 'color';
import invariant from 'tiny-invariant';

import type { SegmentColorIndex } from '../types';

// "Aurora" palette: violets, magentas, pinks and blues, complemented by warm "sunset" tones (coral, orange, peach).
// Intentionally contains no greens, teals or yellow-greens (all hues are within 0-30 or 200-350 degrees).
// Ordered so that neighbouring segments get clearly different hues.
const colorStrings = '#8a2be2, #ff4fa3, #3d7bff, #ff9f5a, #d36bff, #4fb8ff, #ff6b8b, #6a1bff, #ff8a5c, #82b1ff, #e040fb, #ffab91, #5b5bff, #ff85d8, #2196f3, #ff5e3a, #b388ff, #f06292, #3f51b5, #ffa07a, #7c4dff, #c51162, #9fa8ff, #ff3d6e'.split(',').map((str) => str.trim());
const colors = colorStrings.map((str) => color(str));

function getColor(n: number) {
  const ret = colors[n % colors.length];
  invariant(ret != null);
  return ret;
}

// eslint-disable-next-line import/prefer-default-export
export function getSegColor(seg: SegmentColorIndex | undefined) {
  if (!seg) {
    return color({
      h: 0,
      s: 0,
      v: 100,
    });
  }
  const { segColorIndex } = seg;

  return getColor(segColorIndex);
}
