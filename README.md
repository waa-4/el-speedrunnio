# El Speedrunnio v3 - Grid Chaos Update
## Controls
- Move: A/D or Arrow Keys
- Jump: W / Up / Space
- Dash: Q
- Sword: click or tap game area
- Retry: R
- Exit: Escape

## New in v3
- Fully grid-based editor like because.blocks / Jerry Pixel Lab
- Faster default speed
- Speedrun timer and fastest run per level
- Cluttered maze levels
- Touch boost orb: `B`
- More enemies: `C` chaser, `L` laser, `N` cannon
- Breakable blocks: `X`
- Spikes: `^`
- Effects, wind FX, screen shake
- Eye expressions: blink, X dead, O hit/boost, ^ complete, >/< dash/facing
- Settings toggles for shake, death/break shake, sound, and effects

## Playlist Music
Put music inside the `playlist` folder.

Recommended: edit `playlist/playlist.json`.

Example:
```json
[
  "playlist/track1.mp3",
  "playlist/track2.mp3"
]
```

If playlist.json is empty/missing, the game tries common names:
- playlist/track1.mp3
- playlist/track2.mp3
- playlist/track3.mp3
- playlist/music.mp3
- playlist/breakcore.mp3
- playlist/song.mp3

If it finds nothing, it plays nothing.
