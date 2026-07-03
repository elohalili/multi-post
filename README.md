# Multi-Post

Standalone desktop app. Write a caption, attach one or more photos, pick which
Facebook groups to post to, then:

1. **Open Facebook & log in** — opens your installed Google Chrome (or Microsoft
   Edge) on the FB login page. Log in once; the session is remembered for next time.
2. **Fill all selected groups** — opens each selected group in a tab, fills the
   composer with your caption + photos, then **stops**. You review every tab and
   click **Post** yourself.

Nothing is ever posted automatically. The app drives your own installed browser —
**Google Chrome or Microsoft Edge must be installed** on the machine.

## Run from source (dev)

```bash
npm install
npm start
```

## Build installers

```bash
npm run dist
```

Produces a macOS `.dmg` and a Windows `.exe` (NSIS) in `dist/`. No Chromium is
bundled — the installed Chrome/Edge is used at runtime, so the installer is small.

## How it works

- `electron/main.js` — Electron main process; owns the Playwright browser, handles
  file picking and settings persistence (`settings.json` under the app's userData).
- `electron/poster.js` — launches the user's installed Chrome/Edge via Playwright's
  `channel` option (FB login persists in a profile dir), then fills each group's
  composer with caption + photos. Never closes tabs, never clicks Post.
- `renderer/` — the form (caption, photo picker, group list with checkboxes,
  progress log).

## Notes

- Facebook changes its page layout often. If auto-fill misses on a group, the log
  shows `⚠` and leaves the tab open — just fill that one manually.
- Tabs open one at a time on purpose; opening many at once trips Facebook's bot checks.
- The group list and caption are saved between runs. Photos are picked fresh each session.
