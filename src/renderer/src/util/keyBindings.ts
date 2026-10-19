import type { KeyBinding, KeyboardAction } from '../../../common/types';
import type { KeyboardLayoutMap } from '../types';


// Key bindings normally refer to the physical key position (US layout), but undo/redo should follow the letter printed
// on the key, like in other apps. E.g. on a German (QWERTZ) keyboard, the letter Z is on the physical KeyY.
const letterBasedDefaultBindings: Record<string, KeyboardAction> = {
  'ControlLeft+KeyZ': 'undo',
  'MetaLeft+KeyZ': 'undo',
  'ControlLeft+ShiftLeft+KeyZ': 'redo',
  'MetaLeft+ShiftLeft+KeyZ': 'redo',
};

// Move the default undo/redo bindings to the physical key that has the letter Z in the current keyboard layout.
// Bindings changed by the user are left alone.
export function localizeUndoRedoKeyBindings(keyBindings: KeyBinding[], keyboardLayoutMap: KeyboardLayoutMap): KeyBinding[] {
  const zCode = [...keyboardLayoutMap.entries()].find(([, char]) => char.toLowerCase() === 'z')?.[0];
  if (zCode == null || zCode === 'KeyZ') return keyBindings;

  const existingKeys = new Set(keyBindings.map(({ keys }) => keys));
  let changed = false;
  const newBindings = keyBindings.map((binding) => {
    if (letterBasedDefaultBindings[binding.keys] !== binding.action) return binding;
    const keys = binding.keys.replace('KeyZ', zCode);
    if (existingKeys.has(keys)) return binding; // don't create a duplicate binding
    changed = true;
    return { ...binding, keys };
  });
  return changed ? newBindings : keyBindings;
}

const acceleratorModifiers: Record<string, (isMac: boolean) => string> = {
  ControlLeft: () => 'Ctrl',
  ControlRight: () => 'Ctrl',
  ShiftLeft: () => 'Shift',
  ShiftRight: () => 'Shift',
  AltLeft: () => 'Alt',
  AltRight: () => 'Alt',
  MetaLeft: (isMac) => (isMac ? 'Command' : 'Super'),
  MetaRight: (isMac) => (isMac ? 'Command' : 'Super'),
};

const acceleratorKeyNames: Record<string, string> = {
  Space: 'Space',
  Enter: 'Enter',
  Escape: 'Esc',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Insert: 'Insert',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
};

// Convert a key binding to an Electron menu accelerator string, e.g. "ControlLeft+KeyZ" => "Ctrl+Z"
export function keyBindingToAccelerator(keys: string, keyboardLayoutMap: KeyboardLayoutMap, isMac: boolean): string | undefined {
  const parts = keys.split('+');
  const modifiers = parts.filter((code) => acceleratorModifiers[code] != null);
  const mainKeys = parts.filter((code) => acceleratorModifiers[code] == null);
  if (mainKeys.length !== 1) return undefined;
  const [mainKey] = mainKeys;

  let keyName: string | undefined;
  if (/^F\d{1,2}$/.test(mainKey!)) keyName = mainKey;
  else if (acceleratorKeyNames[mainKey!] != null) keyName = acceleratorKeyNames[mainKey!];
  else {
    const char = keyboardLayoutMap.get(mainKey!);
    if (char != null && char.length === 1) keyName = char === '+' ? 'Plus' : char.toUpperCase();
  }
  if (keyName == null) return undefined;

  return [...new Set(modifiers.map((code) => acceleratorModifiers[code]!(isMac))), keyName].join('+');
}

// Which binding to show in the Edit menu for each of undo/redo
export function getUndoRedoAccelerators(keyBindings: KeyBinding[], keyboardLayoutMap: KeyboardLayoutMap, isMac: boolean) {
  const getAccelerator = (action: KeyboardAction) => {
    const isMetaBinding = (keys: string) => keys.split('+').some((code) => code === 'MetaLeft' || code === 'MetaRight');
    // prefer Cmd bindings on macOS, and non-Win key bindings on other platforms
    const bindings = keyBindings.filter((binding) => binding.action === action)
      .sort((a, b) => Number(isMetaBinding(b.keys) === isMac) - Number(isMetaBinding(a.keys) === isMac));
    for (const { keys } of bindings) {
      const accelerator = keyBindingToAccelerator(keys, keyboardLayoutMap, isMac);
      if (accelerator != null) return accelerator;
    }
    return undefined;
  };
  return { undo: getAccelerator('undo'), redo: getAccelerator('redo') };
}
