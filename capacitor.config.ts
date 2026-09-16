import type { CapacitorConfig } from '@capacitor/cli';

// ─────────────────── Capacitor config ───────────────────
//
// Wraps the single-file Vite build (dist/index.html) into a native
// Android shell. The webDir points at the Vite output; `cap sync`
// copies it into android/app/src/main/assets/public before each
// Android build.
//
// App id follows reverse-DNS Android convention (com.<org>.<app>).
// Bump the versionCode when shipping a new build — Play Store
// requires monotonically increasing codes per package.

const config: CapacitorConfig = {
  appId: 'com.beserk.blacksword',
  appName: 'Black Sword',
  webDir: 'dist',

  android: {
    // Allow self-signed debug builds to load any HTTP origin (the
    // single-file build is inlined, so we never actually need
    // cleartext traffic — but the Capacitor scheme proxy sets up a
    // https://localhost origin and that needs to be allowed).
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: '#0a0c12',
  },

  server: {
    // The Vite dev server URL — only consulted when running
    // `npx cap run android` against `npm run dev`. Production
    // builds use the bundled dist/ assets.
    androidScheme: 'https',
  },
};

export default config;
