/* brand.jsx — Multi-Post brand mark (elo² brush cycle) + UI icon set.
   Exports to window: BrushMark, Wordmark, Ic (stroke-icon set). */

// ── elo² brush signature path (in a 512 box) ───────────────────────────────
const ELO =
  "m18.9 82.99c1.41-21.92 16.69-21.32 29.61-20.24 12.91 1.09 13.66 4.91 63.68 0.88 50.03-4.03 151.71-19.38 168.58-20.31 16.86-0.94 126.71-5.62 139.07-4.53 12.35 1.09 56.75-3.5 58.98 16.46 2.23 19.97 10.63 31.95-44.63 32.85-58.5 0.95-127.98 5.7-167.16 7.59-38.14 1.84-112.34 13.47-152.44 14.61-40.1 1.15-98.9 22.77-95.69-27.31zm-3 101.78c2.01 16.33 11.93 28.08 55.67 23.76 43.75-4.33 161.01-12.18 182.59-13.85 21.58-1.67 145.85-9.9 171.27-7.81 25.42 2.09 48.12-4.21 48.46-25.09 0.34-20.89-9-25.8-37.65-22.28-28.66 3.51-145.09 7.86-194.29 12.17-49.21 4.32-179.67 8.73-195.78 7.91-16.11-0.81-32.44 7.56-30.27 25.19zm211.22 49.89c31.74-5.72 91.15-14.94 123.3-15.68 32.16-0.74 71.98-1.07 87.63 0.08 15.66 1.15 39.48-2.46 40.93 20.94 1.45 23.4-4.19 32.57-34.89 26.78-30.69-5.78-89.64-5.95-122.54-2.45-32.91 3.5-151.85 22.38-199.17 25.57-47.33 3.2-107.78 21.39-108.66-12.16-0.89-33.56 22.77-35.27 37.53-30.67 14.76 4.6 144.12-6.68 175.87-12.41zm-212.47 137c0 0-1.67-32.1 19.96-32.05 21.62 0.04 16.19 33.58 16.81 43.6 0.61 10.01-1.81 26.62-1.81 26.62 0 0-5.03 16.96 14.78 14.08 19.82-2.89 56.83-2.55 76.36-5.81 19.53-3.26 71.45-8.44 71.45-8.44 0 0 30.31-6.45 28.12 24.58-1.87 26.41-14.89 25.96-34.16 26.79-19.26 0.84-88.99 2.06-105.19 5.02-16.2 2.95-64.86 12.38-74.44-0.43-9.57-12.8-14.8-26.35-12.93-67.67 1.86-41.32 1.05-26.29 1.05-26.29zm98.78-1.42c1.8 29.5 40.24 29.98 41-3.59 0.75-33.57-43.2-32.45-41 3.59zm181.53-65.01c0 0-42.42-2.66-33.42 42.25 5.64 28.15 7.24 40.49 15.98 48.62 8.75 8.13 32.3 4.17 29.37-22.51-2.92-26.69-5.39-17.24 6.14-19.74 11.54-2.5 74.57-9.02 87.95-10.09 13.38-1.06 81.02 8.23 81.5-18.75 0.48-26.97-1.7-29.39-20.05-29.64-18.35-0.25-2.8 0.99-35.94 2.43-33.13 1.44-76.01 5.29-90.66 5.04-14.65-0.25-40.87 2.39-40.87 2.39zm47.95 81.82c0.81 12.44 1.24 20.26 11.74 18.29 10.5-1.97 12.81-3.91 25.73-2.59 12.91 1.32 37.37 1.89 41.93-13.97 4.56-15.85-2.71-19.23-13.16-20.86-10.45-1.62-39.86-5.87-51.64 1.11-11.78 6.97-15.42 5.58-14.6 18.02z";

// ── tapered brush-arc + flared head (from the brand's brush-arrows kit) ─────
const D2R = Math.PI / 180;
function brushArc(cx, cy, r, a0, a1, opt = {}) {
  const {
    wMax = 8.5,
    wStart = 1.1,
    wEnd = 2.6,
    wobble = 0.5,
    peak = 0.42,
    N = 60,
    seed = 1,
  } = opt;
  const outer = [],
    inner = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N,
      a = a0 + (a1 - a0) * t;
    let env =
      t < peak
        ? wStart + (wMax - wStart) * Math.pow(t / peak, 0.65)
        : wEnd + (wMax - wEnd) * Math.pow(1 - (t - peak) / (1 - peak), 0.85);
    env += wobble * Math.sin(t * Math.PI * 5 + seed) * Math.sin(Math.PI * t);
    const w = Math.max(0.8, env),
      ca = Math.cos(a * D2R),
      sa = Math.sin(a * D2R);
    const px = cx + r * ca,
      py = cy + r * sa;
    outer.push([px + (w / 2) * ca, py + (w / 2) * sa]);
    inner.push([px - (w / 2) * ca, py - (w / 2) * sa]);
  }
  let d = `M ${outer[0][0].toFixed(2)} ${outer[0][1].toFixed(2)} `;
  for (let i = 1; i < outer.length; i++)
    d += `L ${outer[i][0].toFixed(2)} ${outer[i][1].toFixed(2)} `;
  for (let i = inner.length - 1; i >= 0; i--)
    d += `L ${inner[i][0].toFixed(2)} ${inner[i][1].toFixed(2)} `;
  return d + "Z";
}
function brushHead(cx, cy, r, aEnd, dirSign = 1, opt = {}) {
  const { len = 15, wing = 13 } = opt;
  const ca = Math.cos(aEnd * D2R),
    sa = Math.sin(aEnd * D2R);
  const tx = -sa * dirSign,
    ty = ca * dirSign;
  const bx = cx + r * ca - tx * (len * 0.35),
    by = cy + r * sa - ty * (len * 0.35);
  const tip = [bx + tx * len, by + ty * len];
  const lWing = [cx + (r + wing / 2) * ca - tx, cy + (r + wing / 2) * sa - ty];
  const rWing = [cx + (r - wing / 2) * ca - tx, cy + (r - wing / 2) * sa - ty];
  const mx = bx - tx * 2,
    my = by - ty * 2;
  return (
    `M ${tip[0].toFixed(2)} ${tip[1].toFixed(2)} ` +
    `Q ${(tip[0] + (lWing[0] - tip[0]) * 0.5 - tx * 3).toFixed(2)} ${(tip[1] + (lWing[1] - tip[1]) * 0.5 - ty * 3).toFixed(2)} ${lWing[0].toFixed(2)} ${lWing[1].toFixed(2)} ` +
    `Q ${mx.toFixed(2)} ${my.toFixed(2)} ${rWing[0].toFixed(2)} ${rWing[1].toFixed(2)} ` +
    `Q ${(tip[0] + (rWing[0] - tip[0]) * 0.5 - tx * 3).toFixed(2)} ${(tip[1] + (rWing[1] - tip[1]) * 0.5 - ty * 3).toFixed(2)} ${tip[0].toFixed(2)} ${tip[1].toFixed(2)} Z`
  );
}

// Rounded-square brand tile with the brush cycle arrows + (optional) elo signature.
function BrushMark({
  size = 36,
  radius = 0.26,
  bg = "#33383f",
  ink = "#ffffff",
  mark = true,
  ring = false,
}) {
  const arcs = [
    { r: 37, a0: 202, a1: 338 },
    { r: 37, a0: 22, a1: 158 },
  ];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * radius,
        background: bg,
        position: "relative",
        overflow: "hidden",
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: ring ? "inset 0 0 0 1px rgba(255,255,255,0.10)" : "none",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        <g fill={ink}>
          {arcs.map((a, i) => (
            <g key={i}>
              <path
                d={brushArc(50, 50, a.r, a.a0, a.a1, { seed: i ? 3 : 1 })}
              />
              <path d={brushHead(50, 50, a.r, a.a1, 1)} />
            </g>
          ))}
        </g>
      </svg>
      {mark && (
        <svg
          width={size * 0.46}
          height={size * 0.46}
          viewBox="0 0 512 512"
          style={{ position: "absolute" }}
        >
          <path d={ELO} fill={ink} fillRule="evenodd" />
        </svg>
      )}
    </div>
  );
}

function Wordmark({ color = "var(--text)", sub = "var(--text-3)", size = 19 }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        lineHeight: 1,
        gap: 3,
      }}
    >
      <span
        style={{
          fontWeight: 700,
          fontSize: size,
          letterSpacing: "-0.02em",
          color,
        }}
      >
        Multi&#8209;Post
      </span>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontWeight: 500,
          fontSize: 9.5,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: sub,
        }}
      >
        by elo&sup2;
      </span>
    </div>
  );
}

// ── stroke icon set (1.6px, currentColor, 24 box) ───────────────────────────
const S = (p) => ({
  width: p.size || 18,
  height: p.size || 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: p.w || 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});
const Ic = {
  search: (p = {}) => (
    <svg {...S(p)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  plus: (p = {}) => (
    <svg {...S(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  x: (p = {}) => (
    <svg {...S(p)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  check: (p = {}) => (
    <svg {...S(p)}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  chevDown: (p = {}) => (
    <svg {...S(p)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  chevRight: (p = {}) => (
    <svg {...S(p)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  image: (p = {}) => (
    <svg {...S(p)}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.6" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  upload: (p = {}) => (
    <svg {...S(p)}>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 16v3a1 1 0 001 1h12a1 1 0 001-1v-3" />
    </svg>
  ),
  trash: (p = {}) => (
    <svg {...S(p)}>
      <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
    </svg>
  ),
  grip: (p = {}) => (
    <svg {...S(p)}>
      <circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  star: (p = {}) => (
    <svg {...S(p)} fill={p.fill || "none"}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
    </svg>
  ),
  folder: (p = {}) => (
    <svg {...S(p)}>
      <path d="M3 7a2 2 0 012-2h4l2 2.5h8a2 2 0 012 2V18a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  ),
  link: (p = {}) => (
    <svg {...S(p)}>
      <path d="M10 14a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.5 1.5" />
      <path d="M14 10a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7L12 18" />
    </svg>
  ),
  ext: (p = {}) => (
    <svg {...S(p)}>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
    </svg>
  ),
  user: (p = {}) => (
    <svg {...S(p)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </svg>
  ),
  refresh: (p = {}) => (
    <svg {...S(p)}>
      <path d="M21 12a9 9 0 11-3-6.7M21 4v4h-4" />
    </svg>
  ),
  spark: (p = {}) => (
    <svg {...S(p)}>
      <path d="M12 3l1.7 4.8L18 9.5l-4.3 1.7L12 16l-1.7-4.8L6 9.5l4.3-1.7z" />
    </svg>
  ),
  arrowR: (p = {}) => (
    <svg {...S(p)}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  ),
  alert: (p = {}) => (
    <svg {...S(p)}>
      <path d="M12 8v5M12 16.5v.5" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  lock: (p = {}) => (
    <svg {...S(p)}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  ),
  clock: (p = {}) => (
    <svg {...S(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  dots: (p = {}) => (
    <svg {...S(p)}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  copy: (p = {}) => (
    <svg {...S(p)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 012-2h8" />
    </svg>
  ),
  pen: (p = {}) => (
    <svg {...S(p)}>
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
    </svg>
  ),
};

Object.assign(window, { BrushMark, Wordmark, Ic });
