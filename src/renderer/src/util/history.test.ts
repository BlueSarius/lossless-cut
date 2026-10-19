import { describe, it, expect } from 'vitest';

import { createHistory, getCurrentState, pushHistory, redoHistory, undoHistory } from './history';

const pushAll = (states: string[], capacity: number) => states.reduce((h, s) => pushHistory(h, s, capacity), createHistory('s0'));

describe('history', () => {
  it('undoes and redoes', () => {
    let h = pushAll(['s1', 's2'], 10);
    expect(getCurrentState(h)).toBe('s2');
    h = undoHistory(h);
    expect(getCurrentState(h)).toBe('s1');
    h = undoHistory(h);
    expect(getCurrentState(h)).toBe('s0');
    h = undoHistory(h);
    expect(getCurrentState(h)).toBe('s0');
    h = redoHistory(redoHistory(redoHistory(h)));
    expect(getCurrentState(h)).toBe('s2');
  });

  it('undoes one step at a time after capacity has been exceeded', () => {
    let h = pushAll(['s1', 's2', 's3', 's4'], 3);
    expect(h.entries).toEqual(['s2', 's3', 's4']);
    h = undoHistory(h);
    expect(getCurrentState(h)).toBe('s3');
    h = undoHistory(h);
    expect(getCurrentState(h)).toBe('s2');
    h = undoHistory(h);
    expect(getCurrentState(h)).toBe('s2');
  });

  it('drops redo entries when a new state is pushed', () => {
    let h = undoHistory(pushAll(['s1', 's2'], 10));
    h = pushHistory(h, 'x', 10);
    expect(h.entries).toEqual(['s0', 's1', 'x']);
    expect(getCurrentState(redoHistory(h))).toBe('x');
  });

  it('ignores unchanged state', () => {
    const h = pushAll(['s1'], 10);
    expect(pushHistory(h, 's1', 10)).toBe(h);
  });

  it('coalesces updates with the same key into one undo step', () => {
    let h = pushAll(['s1'], 10);
    h = pushHistory(h, 'drag1', 10, 'a');
    h = pushHistory(h, 'drag2', 10, 'a');
    h = pushHistory(h, 'drag3', 10, 'a');
    expect(h.entries).toEqual(['s0', 's1', 'drag3']);
    expect(getCurrentState(undoHistory(h))).toBe('s1');

    // a different key starts a new step
    h = pushHistory(h, 'other', 10, 'b');
    expect(h.entries).toEqual(['s0', 's1', 'drag3', 'other']);
  });

  it('does not coalesce into an entry reached by undo', () => {
    let h = pushHistory(pushAll(['s1'], 10), 'drag1', 10, 'a');
    h = redoHistory(undoHistory(h));
    h = pushHistory(h, 'drag2', 10, 'a');
    expect(h.entries).toEqual(['s0', 's1', 'drag1', 'drag2']);
  });
});
