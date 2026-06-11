/* app.jsx — Multi-Post desktop app (dark). Design recreation (claude.ai/design)
   wired to the real Electron backend: settings persistence, Facebook login via
   Playwright, photo picker, and the multi-group fill run with live progress. */
const { BrushMark, Wordmark, Ic, ComposePane, GroupsPane, RunDrawer } = window;
const {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRadio,
  TweakColor,
  TweakToggle,
} = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  accent: "#3a9be8",
  density: "regular",
  showMembers: true,
}; /*EDITMODE-END*/

const FOLDERS = [
  { id: "birds", name: "Bird photography", short: "Birds", color: "#3a9be8" },
  {
    id: "wildlife",
    name: "Italian wildlife",
    short: "Wildlife",
    color: "#4fae84",
  },
  { id: "landscape", name: "Landscapes", short: "Landscape", color: "#d7a24c" },
  { id: "macro", name: "Macro & detail", short: "Macro", color: "#9a7ee0" },
];
const DUOS = [
  ["#1d4e6b", "#3b8fb8"],
  ["#3a2f5c", "#7d5fc4"],
  ["#5c3a2a", "#c08a52"],
  ["#234b3a", "#4fae84"],
  ["#4a2f3a", "#c46f93"],
  ["#2a3b5c", "#5f86c4"],
];

let _gc = 0;
const normGroups = (arr) =>
  (Array.isArray(arr) ? arr : []).map((g, i) => {
    const url = g.url || "";
    const m = url.match(/groups\/([\w.]+)/);
    return {
      id: g.id || "g" + ++_gc,
      label: g.label || "Facebook group",
      url,
      gid: g.gid || (m ? m[1] : "—"),
      folder: g.folder || FOLDERS[0].id,
      members: g.members || "—",
      duo: g.duo || DUOS[i % DUOS.length],
      enabled: g.enabled !== false,
    };
  });

function ConnPill({ state, onConnect }) {
  if (state === "on")
    return (
      <div className="conn on">
        <span className="cdot" /> <Ic.user size={14} /> Connected ·{" "}
        <b>Facebook</b>
      </div>
    );
  if (state === "connecting")
    return (
      <div className="conn busy">
        <span className="spin">
          <Ic.refresh size={14} />
        </span>{" "}
        Opening browser…
      </div>
    );
  return (
    <button className="conn off" onClick={onConnect}>
      <span className="cdot" /> Not connected — Connect Facebook
    </button>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const dense = t.density === "compact";

  const [caption, setCaption] = React.useState("");
  const [photos, setPhotos] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [sel, setSel] = React.useState(new Set());
  const [conn, setConn] = React.useState("off");
  const [run, setRun] = React.useState({
    open: false,
    items: [],
    done: 0,
    total: 0,
  });
  const [loaded, setLoaded] = React.useState(false);

  // ── load settings + subscribe to run progress ────────────────────────────
  React.useEffect(() => {
    window.api.loadSettings().then((s) => {
      setCaption(s.caption || "");
      const g = normGroups(s.groups);
      setGroups(g);
      setSel(new Set(g.filter((x) => x.enabled).map((x) => x.id)));
      setLoaded(true);
    });
    window.api.onProgress(handleLine);
  }, []);

  // ── persist caption + groups (enabled mirrors selection) ──────────────────
  React.useEffect(() => {
    if (!loaded) return;
    const out = groups.map((g) => ({
      label: g.label,
      url: g.url,
      gid: g.gid,
      folder: g.folder,
      members: g.members,
      duo: g.duo,
      enabled: sel.has(g.id),
    }));
    window.api.saveSettings({ caption, groups: out });
  }, [caption, groups, sel, loaded]);

  // ── live run progress parser (poster.js emits free-text lines) ────────────
  const stamp = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  const setItem = (idx, state, time) =>
    setRun((prev) => {
      const items = prev.items.map((it, i) =>
        i === idx ? { ...it, state, t: time ?? it.t } : it,
      );
      return {
        ...prev,
        items,
        done: items.filter((it) => it.state === "ready").length,
      };
    });
  const handleLine = React.useCallback((line) => {
    if (/Browser not open/.test(line)) {
      setRun((prev) => {
        const items = prev.items.map((it) => ({
          ...it,
          state: "failed",
          t: it.t,
        }));
        return { ...prev, items, done: 0 };
      });
      return;
    }
    if (/^Starting:/.test(line)) {
      setItem(0, "filling");
      return;
    }
    const m = line.match(/\[(\d+)\/(\d+)\]/);
    if (m) {
      const idx = Number(m[1]) - 1;
      const ok = line.trimStart().startsWith("✓");
      setRun((prev) => {
        const items = prev.items.map((it, i) => {
          if (i === idx)
            return { ...it, state: ok ? "ready" : "failed", t: stamp() };
          if (i === idx + 1 && it.state === "queued")
            return { ...it, state: "filling" };
          return it;
        });
        return {
          ...prev,
          items,
          done: items.filter((it) => it.state === "ready").length,
        };
      });
      return;
    }
    if (/^Done\./.test(line)) {
      setRun((prev) => {
        const items = prev.items.map((it) =>
          it.state === "filling" ? { ...it, state: "ready", t: stamp() } : it,
        );
        return {
          ...prev,
          items,
          done: items.filter((it) => it.state === "ready").length,
        };
      });
    }
  }, []);

  // ── photos: real file picker + OS drag-and-drop; thumbnails + dims ────────
  const addPhotoPaths = (paths) => {
    setPhotos((prev) => {
      const have = new Set(prev.map((p) => p.path));
      const fresh = paths
        .filter((f) => !have.has(f))
        .map((path, k) => ({
          id: "p" + Date.now() + "_" + k,
          path,
          name: String(path).split(/[\\/]/).pop(),
          dims: "",
          duo: DUOS[(prev.length + k) % DUOS.length],
        }));
      fresh.forEach((p) => {
        const img = new Image();
        img.onload = () =>
          setPhotos((cur) =>
            cur.map((x) =>
              x.id === p.id
                ? { ...x, dims: `${img.naturalWidth}×${img.naturalHeight}` }
                : x,
            ),
          );
        img.src =
          "file://" +
          String(p.path)
            .replace(/\\/g, "/")
            .split("/")
            .map(encodeURIComponent)
            .join("/");
      });
      return [...prev, ...fresh];
    });
  };
  const addPhotos = async () => {
    const files = await window.api.pickImages();
    addPhotoPaths(files);
  };

  // ── stop the OS dropping a file from navigating the whole window ──────────
  React.useEffect(() => {
    const block = (e) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  const openExternal = (url) => window.api.openExternal(url);

  // ── connect (Facebook login) ──────────────────────────────────────────────
  const connect = async () => {
    setConn("connecting");
    try {
      await window.api.startLogin();
      setConn("on");
    } catch {
      setConn("off");
    }
  };

  const selectedGroups = groups.filter((g) => sel.has(g.id));
  const canFill = conn === "on" && sel.size > 0 && caption.trim().length > 0;

  // ── fill run ──────────────────────────────────────────────────────────────
  const startRun = async () => {
    const items = selectedGroups.map((g) => ({
      id: g.id,
      label: g.label,
      url: g.url,
      state: "queued",
      t: "",
    }));
    setRun({ open: true, items, done: 0, total: items.length });
    try {
      await window.api.runPost({
        caption,
        images: photos.map((p) => p.path),
        groups: selectedGroups.map((g) => g.url),
      });
    } catch {
      /* progress lines surface failures */
    }
  };
  const closeRun = () => setRun((r) => ({ ...r, open: false }));

  const primary = () => {
    if (conn !== "on")
      return (
        <button
          className="btn-accent lg"
          onClick={connect}
          disabled={conn === "connecting"}
        >
          <Ic.link size={17} /> <span>Connect Facebook</span>
        </button>
      );
    return (
      <button className="btn-accent lg" onClick={startRun} disabled={!canFill}>
        <Ic.arrowR size={17} />{" "}
        <span>
          Fill {sel.size} group{sel.size === 1 ? "" : "s"}
        </span>
      </button>
    );
  };

  const appStyle = {
    "--accent": t.accent,
    "--accent-soft": t.accent + "22",
    "--accent-line": t.accent + "55",
  };

  return (
    <div className="desktop">
      <div
        className="app"
        style={appStyle}
        data-members={t.showMembers ? "1" : "0"}
      >
        {/* header */}
        <header className="appbar">
          <div className="brand">
            <BrushMark size={40} radius={0.27} />
            <Wordmark />
          </div>
          <div className="brand-tag">
            Stage one caption + your photos into every selected Facebook group.
          </div>
          <div style={{ flex: 1 }} />
          <div className="safety">
            <Ic.lock size={14} /> Never posts — drafts only
          </div>
          <ConnPill state={conn} onConnect={connect} />
          {primary()}
        </header>

        {/* workspace */}
        <div className="work">
          <section className="col col-left">
            <ComposePane
              caption={caption}
              setCaption={setCaption}
              photos={photos}
              setPhotos={setPhotos}
              onAddPhotos={addPhotos}
              onDropFiles={addPhotoPaths}
              dense={dense}
            />
          </section>
          <section className="col col-right">
            <GroupsPane
              groups={groups}
              setGroups={setGroups}
              sel={sel}
              setSel={setSel}
              folders={FOLDERS}
              dense={dense}
              onOpen={openExternal}
            />
          </section>
        </div>

        <RunDrawer
          open={run.open}
          onClose={closeRun}
          runItems={run.items}
          done={run.done}
          total={run.total}
          onOpen={openExternal}
        />
      </div>

      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={["#3a9be8", "#4fae84", "#9a7ee0", "#d7a24c"]}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["regular", "compact"]}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakSection label="Groups list" />
        <TweakToggle
          label="Show member counts"
          value={t.showMembers}
          onChange={(v) => setTweak("showMembers", v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
