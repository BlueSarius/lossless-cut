# 06 — Undo/redo shortcuts follow the letter Z on any keyboard layout

**Type:** preference / fix (German QWERTZ keyboard) · **Depends on:** 05 (Edit menu undo items), and the `menu()` signature after 03

## What & why
Key bindings refer to the physical key position (US layout). On a German QWERTZ keyboard, the default undo was Ctrl + the key labelled **Y**. When the keyboard layout is known, the **default** undo/redo bindings move to the key that has the letter **Z**. Bindings the user changed are left alone. The Edit menu's Undo/Redo also show the user's actual undo/redo bindings: display only on Windows/Linux, where the renderer handles the keys.

## How
- New `src/renderer/src/util/keyBindings.ts` (tests in `keyBindings.test.ts`):
  - `localizeUndoRedoKeyBindings(keyBindings, keyboardLayoutMap)`:
    - It finds the physical code whose layout character is `z`.
    - Only the default bindings (`ControlLeft+KeyZ`/`MetaLeft+KeyZ` → undo, `ControlLeft+ShiftLeft+KeyZ`/`MetaLeft+ShiftLeft+KeyZ` → redo) have `KeyZ` replaced by that code.
    - It never creates duplicates, and returns the same array if nothing changed.
  - `getUndoRedoAccelerators(keyBindings, keyboardLayoutMap, isMac)` turns the current undo/redo bindings into Electron accelerator strings.
- `App.tsx` (after `useKeyboard` gives `keyboardLayoutMap`), two effects:
  1. Localize the bindings and `setKeyBindings` if they changed.
  2. `ipcRenderer.send('setUndoRedoAccelerators', getUndoRedoAccelerators(...))`.
- `src/main/index.ts`:
  - Keep `let undoRedoAccelerators: UndoRedoAccelerators = {}`.
  - `ipcMain.on('setUndoRedoAccelerators')` parses with zod `{ undo?: string, redo?: string }`, then calls `updateMenu()`.
  - Pass `undoRedoAccelerators` to `menu()`.
- `src/main/menu.ts`:
  - Export `UndoRedoAccelerators` and accept it as a param.
  - The Undo/Redo items use `getUndoRedoAccelerator(acc)` → `{ accelerator, registerAccelerator: false }`. On macOS, a single key without a modifier is skipped (`{}`).

## Verify
- `yarn test run src/renderer/src/util/keyBindings.test.ts`, `yarn tsc`, `yarn lint`.
- Manual on Windows with a German layout: Ctrl+Z (the key labelled Z) undoes, and the Edit menu shows the same shortcut.

## Drop when
Upstream makes key bindings layout-aware for letters, or handles undo/redo by letter itself.
