# El Speedrunnio v1 Fixed

This is the fixed version of the black/grey/white speedrun platformer.

## Main fix

The old version could speed itself up because multiple `requestAnimationFrame` loops could stack when starting/retrying levels.

This version uses:

- `animationId`
- `startGameLoop()`
- `stopGameLoop()`
- `cancelAnimationFrame(animationId)`
- dt-based movement

## Controls

- Move: A/D or Arrow Keys
- Jump: W, Up, or Space
- Dash: Shift or E
- Sword: Click / tap game area
- Retry: R
- Exit: Escape or Exit button

## Testing Link (ignore this)

[README.md](https://github.com/user-attachments/files/28113550/README.md)
