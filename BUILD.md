# Building the Android APK

This project wraps a single-file Vite build (the entire game is one
`dist/index.html` of ~1.1 MB) inside a Capacitor Android shell. The
build chain is:

```
vite build  →  cap sync  →  gradlew assembleDebug
   (web)       (copy)        (APK)
```

## Prerequisites

You need a machine with:

- **Node.js 18+** (for Vite + Capacitor CLI)
- **JDK 17** (`brew install --cask zulu@17` on macOS, or any
  Temurin/Adoptium build)
- **Android SDK** with the following components installed:
  - `platform-tools`
  - `platforms;android-35`
  - `build-tools;35.0.0`

  The easiest path is to install **Android Studio** (which bundles
  the SDK manager) and let it install these automatically.
- **`ANDROID_HOME`** (or `ANDROID_SDK_ROOT`) exported to your shell,
  pointing at your SDK install:

  ```sh
  export ANDROID_HOME=$HOME/Library/Android/sdk      # macOS
  export ANDROID_HOME=$HOME/Android/Sdk              # Linux
  ```

Verify your toolchain:

```sh
java -version          # 17+
node --version         # 18+
echo $ANDROID_HOME     # non-empty
```

## One-time setup

```sh
npm install
npm run build          # produces dist/index.html (the single-file game)
npm run cap:add:android   # generates the android/ tree if missing
```

`cap:add:android` only needs to run once — it copies the official
Capacitor Android template into `android/`. Subsequent runs use the
checked-in scaffold.

## Daily build

```sh
npm run apk:debug
```

That single script runs `vite build`, then `cap sync android` (which
copies `dist/` into `android/app/src/main/assets/public/`), then
`./gradlew assembleDebug`. The APK lands at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

To install onto a connected device / emulator:

```sh
npm run apk:install:debug
```

## Release builds

Release builds require a signing config. The default `app/build.gradle`
leaves `signingConfig` unset, so `./gradlew assembleRelease` will
produce an unsigned APK that won't install. To sign:

1. Generate a keystore (once):

   ```sh
   keytool -genkey -v -keystore release.keystore -alias blacksword \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Add to `~/.gradle/gradle.properties` (NOT committed):

   ```
   BLACKSWORD_RELEASE_STORE_FILE=release.keystore
   BLACKSWORD_RELEASE_KEY_ALIAS=blacksword
   BLACKSWORD_RELEASE_STORE_PASSWORD=...
   BLACKSWORD_RELEASE_KEY_PASSWORD=...
   ```

3. Append a `signingConfigs.release { ... }` block to
   `android/app/build.gradle` that reads those properties, and
   reference it from `buildTypes.release.signingConfig`.

4. Run:

   ```sh
   npm run apk:release
   ```

   The signed APK lands at
   `android/app/build/outputs/apk/release/app-release.apk`.

## Capacitor sync

After any change to `dist/` (i.e. anything that affects the game), run:

```sh
npm run cap:sync
```

This rebuilds the web bundle and copies it into the Android assets
folder. The next `./gradlew` build will pick up the new files.

If you only changed Java/Kotlin/Android-side code (gradle, manifest,
plugins), you can skip the sync and just run `gradlew` directly.

## Project layout

```
.
├── capacitor.config.ts        # appId, webDir, native config
├── vite.config.ts             # vite-plugin-singlefile (one big HTML)
├── src/                       # React + engine code
├── dist/                      # built single-file HTML
└── android/
    ├── app/
    │   ├── build.gradle       # app module gradle config
    │   └── src/main/
    │       ├── AndroidManifest.xml
    │       ├── java/com/beserk/blacksword/MainActivity.java
    │       ├── res/           # icon, splash, strings, themes
    │       └── assets/public/ # ← cap sync drops the game here
    ├── build.gradle           # top-level gradle
    ├── settings.gradle        # module includes
    ├── variables.gradle       # SDK versions + AndroidX versions
    ├── gradle.properties      # JVM args + AndroidX flags
    └── gradle/wrapper/        # gradle-wrapper.jar (download on first run)
```

## Plugin: enabling Capacitor plugins

Capacitor plugins (camera, haptics, share, status-bar, etc.) are
added per-package:

```sh
npm install @capacitor/haptics @capacitor/status-bar
npx cap sync android
```

Each plugin auto-registers on `cap sync`; the Android-side dependencies
are appended to `android/capacitor.settings.gradle` and to
`android/app/build.gradle`.

For this build we don't need any — the game uses procedural WebAudio
(see `src/engine/sfx.ts`) and the save system is `localStorage`-backed,
which the WebView handles natively.

## Troubleshooting

### `SDK location not found`

`gradlew` can't find the Android SDK. Either export `ANDROID_HOME`
or create `android/local.properties`:

```
sdk.dir=/Users/you/Library/Android/sdk
```

### `JAVA_HOME is set to an invalid directory`

You have multiple JDKs installed; gradle needs JDK 17 specifically.
The easiest fix is to point `JAVA_HOME` at the right one before
running gradle:

```sh
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
```

### WebView shows a blank white screen

1. Open `chrome://inspect/#devices` on a desktop Chrome.
2. Connect the device with USB debugging enabled.
3. Look at the WebView console — typically a 404 on a missing asset
   because `cap sync` wasn't re-run after a build.

### Fonts don't load on first boot

`index.html` preconnects to `fonts.googleapis.com`. The bundled
single-file build is offline-capable *after* the first load, but the
WebView will still attempt the preconnect. To make it fully offline,
either vendor the fonts into `src/index.css` or remove the
`<link rel="preconnect">` and switch to system-ui.

## Build sizes

```
dist/index.html                  ~1.10 MB  (the entire game, inlined)
android/app/build/outputs/apk/debug/app-debug.apk     ~3.5 MB
android/app/build/outputs/apk/release/app-release.apk ~2.1 MB (after R8)
```

## CI

The `npm run apk:debug` command is non-interactive and exits 0 on
success, so it's directly usable from a CI runner. For CI you'll
also need the SDK installed; the simplest path is to use
`reactivecircus/android-emulator-runner` or
`android-actions/setup-android` GitHub Actions.
