// Transpile the renderer's .jsx files to plain .js ahead of time so the packaged
// app needs no in-browser Babel. Each file is a classic script that shares state
// only through window globals, so we transform per-file (bundle: false) — output
// scope matches the old Babel-in-browser behaviour exactly.

const esbuild = require('esbuild');
const path = require('node:path');

const rendererDir = path.join(__dirname, '..', 'renderer');
const entries = ['tweaks-panel.jsx', 'brand.jsx', 'panes.jsx', 'app.jsx'];

esbuild.build({
  entryPoints: entries.map((f) => path.join(rendererDir, f)),
  outdir: rendererDir,
  bundle: false,
  loader: { '.jsx': 'jsx' },
  jsx: 'transform',           // React.createElement / React.Fragment (React is a global)
  format: 'iife',
  target: 'chrome110',
  logLevel: 'info',
}).then(() => {
  console.log('Renderer JSX transpiled to .js');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
