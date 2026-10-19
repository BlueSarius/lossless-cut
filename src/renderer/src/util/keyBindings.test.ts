import { describe, it, expect } from 'vitest';

import type { KeyBinding } from '../../../common/types';
import { getUndoRedoAccelerators, keyBindingToAccelerator, localizeUndoRedoKeyBindings } from './keyBindings';

const usLayout = new Map([['KeyY', 'y'], ['KeyZ', 'z'], ['KeyA', 'a'], ['Comma', ','], ['Equal', '=']]);
const germanLayout = new Map([['KeyY', 'z'], ['KeyZ', 'y'], ['KeyA', 'a'], ['Comma', ','], ['BracketRight', '+']]);

const defaultBindings: KeyBinding[] = [
  { keys: 'KeyZ', action: 'timelineToggleComfortZoom' },
  { keys: 'ControlLeft+KeyZ', action: 'undo' },
  { keys: 'MetaLeft+KeyZ', action: 'undo' },
  { keys: 'ControlLeft+ShiftLeft+KeyZ', action: 'redo' },
  { keys: 'MetaLeft+ShiftLeft+KeyZ', action: 'redo' },
];

describe('localizeUndoRedoKeyBindings', () => {
  it('does nothing on a US layout', () => {
    expect(localizeUndoRedoKeyBindings(defaultBindings, usLayout)).toBe(defaultBindings);
  });

  it('moves default undo/redo to the key labeled Z on a German layout', () => {
    expect(localizeUndoRedoKeyBindings(defaultBindings, germanLayout)).toEqual([
      { keys: 'KeyZ', action: 'timelineToggleComfortZoom' },
      { keys: 'ControlLeft+KeyY', action: 'undo' },
      { keys: 'MetaLeft+KeyY', action: 'undo' },
      { keys: 'ControlLeft+ShiftLeft+KeyY', action: 'redo' },
      { keys: 'MetaLeft+ShiftLeft+KeyY', action: 'redo' },
    ]);
  });

  it('is stable once localized', () => {
    const localized = localizeUndoRedoKeyBindings(defaultBindings, germanLayout);
    expect(localizeUndoRedoKeyBindings(localized, germanLayout)).toBe(localized);
  });

  it('leaves bindings changed by the user alone', () => {
    const bindings: KeyBinding[] = [{ keys: 'ControlLeft+KeyU', action: 'undo' }, { keys: 'ControlLeft+KeyZ', action: 'export' }];
    expect(localizeUndoRedoKeyBindings(bindings, germanLayout)).toBe(bindings);
  });

  it('does not create duplicate bindings', () => {
    const bindings: KeyBinding[] = [{ keys: 'ControlLeft+KeyZ', action: 'undo' }, { keys: 'ControlLeft+KeyY', action: 'export' }];
    expect(localizeUndoRedoKeyBindings(bindings, germanLayout)).toBe(bindings);
  });
});

describe('keyBindingToAccelerator', () => {
  it('converts using the letter on the key', () => {
    expect(keyBindingToAccelerator('ControlLeft+KeyZ', usLayout, false)).toBe('Ctrl+Z');
    expect(keyBindingToAccelerator('ControlLeft+KeyY', germanLayout, false)).toBe('Ctrl+Z');
    expect(keyBindingToAccelerator('ControlLeft+ShiftLeft+KeyY', germanLayout, false)).toBe('Ctrl+Shift+Z');
    expect(keyBindingToAccelerator('MetaLeft+KeyY', germanLayout, true)).toBe('Command+Z');
    expect(keyBindingToAccelerator('ControlLeft+BracketRight', germanLayout, false)).toBe('Ctrl+Plus');
    expect(keyBindingToAccelerator('ShiftLeft+ArrowLeft', usLayout, false)).toBe('Shift+Left');
    expect(keyBindingToAccelerator('F5', usLayout, false)).toBe('F5');
  });

  it('returns undefined when it cannot convert', () => {
    expect(keyBindingToAccelerator('ControlLeft+NumpadMultiply', usLayout, false)).toBeUndefined();
    expect(keyBindingToAccelerator('ControlLeft', usLayout, false)).toBeUndefined();
  });
});

describe('getUndoRedoAccelerators', () => {
  it('picks the right binding for the platform', () => {
    const localized = localizeUndoRedoKeyBindings(defaultBindings, germanLayout);
    expect(getUndoRedoAccelerators(localized, germanLayout, false)).toEqual({ undo: 'Ctrl+Z', redo: 'Ctrl+Shift+Z' });
    expect(getUndoRedoAccelerators(localized, germanLayout, true)).toEqual({ undo: 'Command+Z', redo: 'Command+Shift+Z' });
  });

  it('follows changed bindings', () => {
    const bindings: KeyBinding[] = [{ keys: 'ControlLeft+KeyA', action: 'undo' }];
    expect(getUndoRedoAccelerators(bindings, usLayout, false)).toEqual({ undo: 'Ctrl+A', redo: undefined });
  });
});
