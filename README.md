# multi-post

Opens each Facebook group in a tab, pre-fills the new-post composer with your
caption + image, then **stops**. You review every tab and click **Post** yourself.

Nothing is ever posted automatically.

## Setup (once)

```bash
npm install
```

## Use

1. Put your group URLs in `groups.txt` (one per line).
2. Launch Chrome with the debug port (your normal Chrome can stay open):
   ```bash
   ./launch-chrome.sh
   ```
   Chrome 136+ blocks remote debugging on the default profile, so this opens a
   dedicated profile (`~/.multi-post-chrome`). **First run only:** log into
   Facebook in that window. The login is saved and reused every later run.
3. In another terminal, run:
   ```bash
   node post.js groups.txt path/to/image.jpg
   ```
   Put your caption text in `caption.txt` (multi-line is fine).
4. The script opens one tab per group and fills caption + image. Switch to
   Chrome, review each tab, and hit **Post**.

## Notes

- Facebook changes its page layout often. If auto-fill misses on a group, the
  script logs `⚠` and leaves the tab open — just fill that one manually.
- Tabs open one at a time on purpose; opening many at once trips Facebook's
  bot checks.
- The script never closes tabs and never clicks Post.
