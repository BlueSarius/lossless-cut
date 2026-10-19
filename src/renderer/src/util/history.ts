// Pure undo/redo history, used by `useStateWithHistory`.
// Replaces react-use's useStateWithHistory, which has an off-by-one bug once `capacity` is reached:
// the position ends up one past the last entry, so the first undo after every edit does nothing.

export interface History<T> {
  entries: T[],
  position: number,
  // set when the current entry was created with a coalesceKey, so that the next update with the same key can be merged into it
  coalesceKey?: string | undefined,
}

export interface SetStateWithHistoryOptions {
  // Successive updates with the same key are merged into a single undo step (e.g. while dragging)
  coalesceKey?: string | undefined,
  // false: update the current entry instead of creating an undo step (e.g. for selection changes)
  recordHistory?: boolean | undefined,
}

export function createHistory<T>(initialState: T): History<T> {
  return { entries: [initialState], position: 0 };
}

export const getCurrentState = <T>(history: History<T>) => history.entries[history.position]!;

export function pushHistory<T>(history: History<T>, newState: T, capacity: number, coalesceKey?: string | undefined): History<T> {
  if (newState === getCurrentState(history)) return history;

  const isAtEnd = history.position === history.entries.length - 1;

  // Merge successive updates with the same key (e.g. while dragging) into a single undo step
  if (coalesceKey != null && coalesceKey === history.coalesceKey && isAtEnd) {
    const entries = [...history.entries];
    entries[history.position] = newState;
    return { entries, position: history.position, coalesceKey };
  }

  // drop any redo entries, then add the new one
  let entries = [...history.entries.slice(0, history.position + 1), newState];
  if (entries.length > capacity) entries = entries.slice(entries.length - capacity);
  return { entries, position: entries.length - 1, coalesceKey };
}

// Update the current entry without creating an undo step. Redo entries are kept.
export function replaceCurrentHistory<T>(history: History<T>, newState: T): History<T> {
  if (newState === getCurrentState(history)) return history;
  const entries = [...history.entries];
  entries[history.position] = newState;
  return { ...history, entries };
}

export function undoHistory<T>(history: History<T>): History<T> {
  if (history.position <= 0) return history;
  return { entries: history.entries, position: history.position - 1 };
}

export function redoHistory<T>(history: History<T>): History<T> {
  if (history.position >= history.entries.length - 1) return history;
  return { entries: history.entries, position: history.position + 1 };
}
