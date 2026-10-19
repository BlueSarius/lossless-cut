import { useCallback, useMemo, useState } from 'react';

import type { SetStateWithHistoryOptions } from '../util/history';
import { createHistory, getCurrentState, pushHistory, redoHistory, replaceCurrentHistory, undoHistory } from '../util/history';


export type SetStateWithHistory<T> = (newStateOrFn: T | ((existing: T) => T), options?: SetStateWithHistoryOptions) => void;

export default function useStateWithHistory<T>(initialState: T, capacity: number) {
  const [history, setHistory] = useState(() => createHistory(initialState));

  const setState = useCallback<SetStateWithHistory<T>>((newStateOrFn, { coalesceKey, recordHistory = true } = {}) => {
    setHistory((existing) => {
      const newState = typeof newStateOrFn === 'function' ? (newStateOrFn as (a: T) => T)(getCurrentState(existing)) : newStateOrFn;
      if (!recordHistory) return replaceCurrentHistory(existing, newState);
      return pushHistory(existing, newState, capacity, coalesceKey);
    });
  }, [capacity]);

  const historyControls = useMemo(() => ({
    back: () => setHistory(undoHistory),
    forward: () => setHistory(redoHistory),
    reset: (state: T) => setHistory(createHistory(state)),
  }), []);

  return [getCurrentState(history), setState, historyControls] as const;
}
