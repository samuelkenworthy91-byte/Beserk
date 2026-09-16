# Black Sword — A Golden Age Tactics Chronicle

A 14-chapter Berserk-inspired tactical RPG, playable on web and Android.

## Features

- 14 fully-authored chapters from the Band-of-the-Hawk arc to the
  Second Eclipse, each with intro/outro dialogue, terrain, encounter
  pacing, and a unique boss.
- Pure-TS engine: hex-free tile combat, AI modes including patrol /
  guard / boss-rage, weapon durability, level-ups.
- Field Guide: rules + bestiary + trophy cabinet + roster, all
  driven by the persisted campaign save.
- Procedural WebAudio: per-class combat SFX, ambient rain on rainy
  chapters, menacing boss hum on rage.
- Cinematic end-screen epilogue after chapter 14 with
  "Begin a New Journey" reset.
- Single-file HTML build (1.1 MB) — fully offline-capable after
  first load.
- Android APK packaging via Capacitor — see [BUILD.md](./BUILD.md).

## Development

```sh
npm install
npm run dev          # vite dev server
npm run test         # vitest run
npm run typecheck    # tsc --noEmit
npm run build        # produces dist/index.html
```

## Building for Android

See [BUILD.md](./BUILD.md). TL;DR:

```sh
npm install
npm run apk:debug    # → android/app/build/outputs/apk/debug/app-debug.apk
```

## Project layout

```
src/
├── components/         # React components (TitleScreen, BattleScreen,
│                       # DialogueScreen, EndScreen, FieldGuide, ...)
├── data/               # chapter1..14.ts, characters.ts, weapons.ts, epilogue.ts
├── engine/             # pure-TS game logic (battle, save, path, fx, sfx)
├── gfx/                # pixel art (battle sprites, portraits, map tiles)
├── assets/             # jpg backgrounds
└── utils/              # cn() helper

android/                # Capacitor Android shell (see BUILD.md)
```

## License

Personal project — Berserk is ©Kentarō Miura / Hakusensha / Studio Gaga.
