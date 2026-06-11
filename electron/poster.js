// Multi-Post core. Owns one Playwright Chromium persistent context shared between
// the "log in" step and the "fill groups" step.
//
// For each Facebook group: opens a tab, opens the composer, types the caption,
// attaches the image(s). STOPS before posting. User reviews each tab and clicks Post.
// Never closes tabs, never clicks Post.

const { chromium } = require('playwright');

// Placeholder text the composer trigger uses, across locales.
const COMPOSER_HINTS = [
  'Write something', "What's on your mind",
  'Scrivi qualcosa', 'A cosa stai pensando',
];

let context = null; // module-level: shared across openLogin() and runPost()

// Launch (or reuse) the persistent browser and land on the FB login page.
// profileDir keeps the FB session across app restarts.
async function openLogin(profileDir) {
  if (context) {
    // Already open — bring a login tab to front and reuse the session.
    const page = context.pages()[0] || (await context.newPage());
    await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' }).catch(() => { });
    await page.bringToFront().catch(() => { });
    return;
  }

  context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: null,
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  // If the user closes the whole browser window, drop the stale context so the
  // next openLogin() relaunches cleanly.
  context.on('close', () => { context = null; });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' }).catch(() => { });
}

function isLoggedInWindowOpen() {
  return !!context;
}

async function fillGroup(url, i, total, caption, images, onProgress) {
  const tag = `[${i + 1}/${total}] ${url}`;
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500); // let React hydrate

    // 1) Open the composer dialog. Try locale text hints, then a generic fallback.
    let opened = false;
    for (const hint of COMPOSER_HINTS) {
      const trigger = page.getByText(hint, { exact: false }).first();
      if (await trigger.count().catch(() => 0)) {
        await trigger.click({ timeout: 4000 }).catch(() => { });
        const dlg = page.getByRole('dialog');
        if (await dlg.first().isVisible({ timeout: 4000 }).catch(() => false)) {
          opened = true;
          break;
        }
      }
    }
    if (!opened) {
      // Fallback: first role=button near top that looks like the composer.
      const btn = page.getByRole('button', { name: new RegExp(COMPOSER_HINTS.join('|'), 'i') }).first();
      await btn.click({ timeout: 4000 }).catch(() => { });
    }

    const dialog = page.getByRole('dialog').first();
    await dialog.waitFor({ state: 'visible', timeout: 8000 });

    // 2) Type the caption into the contenteditable textbox inside the dialog.
    if (caption) {
      const box = dialog.getByRole('textbox').first();
      await box.click({ timeout: 5000 });
      await box.pressSequentially(caption, { delay: 8 });
    }

    // 3) Attach the image(s). FB keeps hidden <input type=file>; set them directly.
    if (images && images.length) {
      const fileInput = dialog.locator('input[type="file"]').first();
      await fileInput.waitFor({ state: 'attached', timeout: 5000 });
      await fileInput.setInputFiles(images);
      await page.waitForTimeout(1500); // let thumbnails render
    }

    onProgress(`✓ ${tag} — caption + ${images.length} photo(s) filled. Review and click Post.`);
  } catch (err) {
    onProgress(`⚠ ${tag} — auto-fill failed (${err.message}). Tab left open; do it manually.`);
  }
  // never close the tab, never click Post
}

// Fill every selected group sequentially. Requires openLogin() first.
async function runPost({ caption, images, groups, onProgress }) {
  if (!context) {
    onProgress('⚠ Browser not open. Click "Open Facebook & log in" first.');
    return;
  }
  onProgress(`Starting: ${groups.length} group(s), ${images.length} photo(s).`);

  // Sequential: opening N tabs at once trips FB rate/bot checks.
  for (let i = 0; i < groups.length; i++) {
    await fillGroup(groups[i], i, groups.length, caption, images, onProgress);
  }

  onProgress('Done. All tabs left open. Review each, then click Post yourself.');
}

module.exports = { openLogin, runPost, isLoggedInWindowOpen };
