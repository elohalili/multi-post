// Download Playwright's Chromium into ./ms-playwright so electron-builder can bundle
// it (see "extraResources" in package.json). At runtime electron/main.js points
// PLAYWRIGHT_BROWSERS_PATH here, so the packaged app needs nothing installed.
//
// Run before packaging:  npm run bundle-chromium   (called automatically by npm run dist)

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const dest = path.join(__dirname, '..', 'ms-playwright');

console.log(`Downloading Chromium into ${dest} …`);
execSync('npx playwright install chromium', {
  stdio: 'inherit',
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: dest },
});

// App runs headed (headless: false), so the headless-shell build and the
// ffmpeg (video-recording) helper are dead weight (~192M). Drop them so they
// don't get bundled and signed.
for (const entry of fs.readdirSync(dest)) {
  if (entry.startsWith('chromium_headless_shell') || entry.startsWith('ffmpeg')) {
    fs.rmSync(path.join(dest, entry), { recursive: true, force: true });
    console.log(`Removed ${entry}`);
  }
}

console.log('Chromium bundled. Ready for electron-builder.');
