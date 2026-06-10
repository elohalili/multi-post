#!/usr/bin/env node
// Multi-post helper.
// Connects to YOUR Chrome (launched via ./launch-chrome.sh) over CDP.
// For each Facebook group: opens a tab, opens the composer, types the caption,
// attaches the image. STOPS before posting. You review each tab and click Post.
//
// Usage:
//   node post.js <groups.txt> <image>
// Caption is read from ./caption.txt.

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.CDP_PORT || 9222;

// ---- args ----
const [, , groupsArg, imageArg] = process.argv;
if (!groupsArg || !imageArg) {
  console.error('Usage: node post.js <groups.txt> <image>   (caption from caption.txt)');
  process.exit(1);
}

const groups = fs.readFileSync(groupsArg, 'utf8')
  .split('\n')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('#'));

const imagePath = path.resolve(imageArg);
if (!fs.existsSync(imagePath)) {
  console.error(`Image not found: ${imagePath}`);
  process.exit(1);
}

if (!fs.existsSync('caption.txt')) {
  console.error('caption.txt not found. Create it with your caption text.');
  process.exit(1);
}
const caption = fs.readFileSync('caption.txt', 'utf8').trim();

console.log(`Groups: ${groups.length} | Image: ${imagePath}`);
console.log(`Caption: ${caption ? caption.slice(0, 60) + (caption.length > 60 ? '…' : '') : '(none)'}`);

// Placeholder text the composer trigger uses, across locales.
const COMPOSER_HINTS = [
  'Write something', "What's on your mind",
  'Scrivi qualcosa', 'A cosa stai pensando',
];

async function fillGroup(context, url, i) {
  const tag = `[${i + 1}/${groups.length}] ${url}`;
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500); // let React hydrate

    // 1) Open the composer dialog. Try locale text hints, then a generic fallback.
    let opened = false;
    for (const hint of COMPOSER_HINTS) {
      const trigger = page.getByText(hint, { exact: false }).first();
      if (await trigger.count().catch(() => 0)) {
        await trigger.click({ timeout: 4000 }).catch(() => {});
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
      await btn.click({ timeout: 4000 }).catch(() => {});
    }

    const dialog = page.getByRole('dialog').first();
    await dialog.waitFor({ state: 'visible', timeout: 8000 });

    // 2) Type the caption into the contenteditable textbox inside the dialog.
    if (caption) {
      const box = dialog.getByRole('textbox').first();
      await box.click({ timeout: 5000 });
      await box.pressSequentially(caption, { delay: 8 });
    }

    // 3) Attach the image. FB keeps hidden <input type=file>; set it directly.
    const fileInput = dialog.locator('input[type="file"]').first();
    await fileInput.waitFor({ state: 'attached', timeout: 5000 });
    await fileInput.setInputFiles(imagePath);
    await page.waitForTimeout(1500); // let thumbnail render

    console.log(`✓ ${tag} — caption + image filled. Review and click Post.`);
  } catch (err) {
    console.log(`⚠ ${tag} — auto-fill failed (${err.message}). Tab left open; do it manually.`);
  }
  // never close the tab, never click Post
}

(async () => {
  let browser;
  try {
    browser = await chromium.connectOverCDP(`http://localhost:${PORT}`);
  } catch {
    console.error(`Cannot reach Chrome on port ${PORT}. Run ./launch-chrome.sh first.`);
    process.exit(1);
  }
  const context = browser.contexts()[0]; // your real profile context
  if (!context) {
    console.error('No browser context found.');
    process.exit(1);
  }

  // Sequential: opening N tabs at once trips FB rate/bot checks.
  for (let i = 0; i < groups.length; i++) {
    await fillGroup(context, groups[i], i);
  }

  console.log('\nDone. All tabs left open. Review each, then click Post yourself.');
  browser.close(); // detaches CDP only; your Chrome + tabs stay open
})();
