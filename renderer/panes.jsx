/* panes.jsx — Compose, Photos, Groups, and Run drawer for Multi-Post.
   Design recreation (claude.ai/design) wired to the Electron host: real photo
   thumbnails + real file picker, real group "open in browser".
   Exports to window: ComposePane, GroupsPane, RunDrawer, Check, IconBtn */
const { Ic, BrushMark } = window;

const fileURL = (p) =>
  "file://" +
  String(p).replace(/\\/g, "/").split("/").map(encodeURIComponent).join("/");

/* ── small primitives ─────────────────────────────────────────────────── */
function IconBtn({ icon, label, onClick, danger, size = 30 }) {
  return (
    <button
      className={"icon-btn" + (danger ? " danger" : "")}
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{ width: size, height: size }}
    >
      {icon}
    </button>
  );
}
function Check({ on, onClick }) {
  return (
    <button
      className={"chk" + (on ? " on" : "")}
      onClick={onClick}
      aria-pressed={on}
      role="checkbox"
    >
      {on && <Ic.check size={13} w={2.6} />}
    </button>
  );
}

/* ── Compose: caption ─────────────────────────────────────────────────── */
function ComposePane({
  caption,
  setCaption,
  templates,
  setTemplates,
  photos,
  setPhotos,
  onAddPhotos,
  onDropFiles,
  dense,
}) {
  const [tplOpen, setTplOpen] = React.useState(false);
  // edit: null = browse; {ix, name, body} = editing (ix === -1 → new)
  const [edit, setEdit] = React.useState(null);
  const chars = caption.length;
  const pad = dense ? 14 : 18;

  const startNew = () =>
    setEdit({ ix: -1, name: "", body: caption });
  const startEdit = (ix) =>
    setEdit({ ix, name: templates[ix].name, body: templates[ix].body });
  const cancelEdit = () => setEdit(null);
  const saveEdit = () => {
    const name = edit.name.trim() || "Untitled";
    const tpl = { name, body: edit.body };
    if (edit.ix === -1) setTemplates([...templates, tpl]);
    else setTemplates(templates.map((t, i) => (i === edit.ix ? tpl : t)));
    setEdit(null);
  };
  const delTpl = (ix) => setTemplates(templates.filter((_, i) => i !== ix));
  return (
    <div className="pane">
      <div className="pane-head">
        <div className="eyebrow">Compose</div>
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative" }}>
          <button className="btn-ghost" onClick={() => setTplOpen((o) => !o)}>
            <Ic.spark size={15} /> Templates <Ic.chevDown size={13} />
          </button>
          {tplOpen && (
            <>
              <div
                className="scrim"
                onClick={() => {
                  setTplOpen(false);
                  setEdit(null);
                }}
              />
              <div className="pop pop-wide">
                {edit ? (
                  <div className="tpl-editor">
                    <div className="pop-label">
                      {edit.ix === -1 ? "New template" : "Edit template"}
                    </div>
                    <input
                      className="tpl-name"
                      value={edit.name}
                      placeholder="Template name"
                      autoFocus
                      onChange={(e) =>
                        setEdit({ ...edit, name: e.target.value })
                      }
                    />
                    <textarea
                      className="tpl-body"
                      value={edit.body}
                      placeholder="Caption body — use {species}, {location}, {month}…"
                      onChange={(e) =>
                        setEdit({ ...edit, body: e.target.value })
                      }
                    />
                    <div className="tpl-editor-foot">
                      <button className="btn-ghost sm" onClick={cancelEdit}>
                        Cancel
                      </button>
                      <button className="btn-accent sm" onClick={saveEdit}>
                        <Ic.check size={13} w={2.4} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="pop-label">Insert a saved caption</div>
                    {templates.length === 0 && (
                      <div className="pop-empty">No templates yet.</div>
                    )}
                    {templates.map((t, ix) => (
                      <div key={ix} className="pop-row">
                        <button
                          className="pop-item"
                          onClick={() => {
                            setCaption(t.body);
                            setTplOpen(false);
                          }}
                        >
                          <Ic.pen size={14} />
                          <div>
                            <div className="pop-item-name">{t.name}</div>
                            <div className="pop-item-sub">
                              {t.body.split("\n")[0]}
                            </div>
                          </div>
                        </button>
                        <div className="pop-row-actions">
                          <IconBtn
                            icon={<Ic.pen size={14} />}
                            label="Edit"
                            onClick={() => startEdit(ix)}
                          />
                          <IconBtn
                            icon={<Ic.trash size={14} />}
                            label="Delete"
                            danger
                            onClick={() => delTpl(ix)}
                          />
                        </div>
                      </div>
                    ))}
                    <button className="pop-add" onClick={startNew}>
                      <Ic.plus size={14} /> New template
                      {caption.trim() ? " from caption" : ""}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className="card"
        style={{ display: "flex", flexDirection: "column", flex: "none" }}
      >
        <div className="composer-top">
          <BrushMark size={30} radius={0.28} />
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontWeight: 650, fontSize: 13.5 }}>Your caption</div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-3)",
                fontFamily: "var(--mono)",
              }}
            >
              pasted into every selected group
            </div>
          </div>
        </div>
        <textarea
          className="composer"
          value={caption}
          placeholder="Write the caption you want dropped into each group…"
          onChange={(e) => setCaption(e.target.value)}
          style={{ padding: pad, minHeight: dense ? 130 : 168 }}
        />
        <div className="composer-foot">
          <span className="mono-meta">
            {chars} chars · {caption.split("\n").length} lines
          </span>
          <button
            className="btn-ghost sm"
            onClick={() => setCaption("")}
            disabled={!chars}
          >
            Clear
          </button>
        </div>
      </div>

      <PhotoBlock
        photos={photos}
        setPhotos={setPhotos}
        onAddPhotos={onAddPhotos}
        onDropFiles={onDropFiles}
        dense={dense}
      />
    </div>
  );
}

/* ── Photos ───────────────────────────────────────────────────────────── */
const IMG_RE = /\.(jpe?g|png|gif|webp|bmp|tiff?|heic)$/i;
function PhotoBlock({ photos, setPhotos, onAddPhotos, onDropFiles, dense }) {
  const dragIx = React.useRef(null);
  const [over, setOver] = React.useState(null);
  const [dropping, setDropping] = React.useState(false);
  const remove = (id) => setPhotos(photos.filter((p) => p.id !== id));
  const onDrop = (i) => {
    const from = dragIx.current;
    if (from == null || from === i) return;
    const next = [...photos];
    const [m] = next.splice(from, 1);
    next.splice(i, 0, m);
    setPhotos(next);
    dragIx.current = null;
    setOver(null);
  };

  // OS file drag-and-drop (Electron exposes the absolute path on File.path)
  const hasFiles = (e) =>
    Array.from(e.dataTransfer.types || []).includes("Files");
  const onZoneOver = (e) => {
    if (hasFiles(e)) {
      e.preventDefault();
      setDropping(true);
    }
  };
  const onZoneLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDropping(false);
  };
  const onZoneDrop = (e) => {
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return; // internal tile reorder — let it pass
    e.preventDefault();
    setDropping(false);
    const paths = files.map((f) => f.path).filter((p) => p && IMG_RE.test(p));
    if (paths.length && onDropFiles) onDropFiles(paths);
  };

  return (
    <div
      className={"photo-drop" + (dropping ? " dropping" : "")}
      onDragOver={onZoneOver}
      onDragLeave={onZoneLeave}
      onDrop={onZoneDrop}
    >
      <div className="pane-head" style={{ marginTop: dense ? 14 : 20 }}>
        <div className="eyebrow">Photos</div>
        <span className="count-chip">{photos.length}</span>
        <div style={{ flex: 1 }} />
        <button className="btn-soft" onClick={onAddPhotos}>
          <Ic.upload size={15} /> Add photos
        </button>
      </div>

      {photos.length === 0 ? (
        <button className="dropzone" onClick={onAddPhotos}>
          <Ic.image size={26} />
          <div style={{ fontWeight: 600, marginTop: 8 }}>
            Click or drag photos here
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            JPG · PNG · up to 10 per post · first photo is the cover
          </div>
        </button>
      ) : (
        <div className="photo-grid">
          {photos.map((p, i) => (
            <div
              key={p.id}
              className={"photo-tile" + (over === i ? " over" : "")}
              draggable
              onDragStart={() => (dragIx.current = i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(i);
              }}
              onDragLeave={() => setOver((o) => (o === i ? null : o))}
              onDrop={() => onDrop(i)}
            >
              <div
                className="photo-img"
                style={{
                  background: `linear-gradient(135deg, ${p.duo[0]}, ${p.duo[1]})`,
                }}
              >
                {p.path && (
                  <img
                    src={fileURL(p.path)}
                    alt={p.name}
                    draggable={false}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                <div className="photo-grain" />
                {i === 0 && (
                  <span className="cover-badge">
                    <Ic.star size={11} fill="currentColor" w={1} /> Cover
                  </span>
                )}
                <button
                  className="tile-x"
                  onClick={() => remove(p.id)}
                  title="Remove"
                >
                  <Ic.x size={13} w={2.2} />
                </button>
                <span className="tile-grip">
                  <Ic.grip size={15} />
                </span>
              </div>
              <div className="photo-meta">
                <span className="photo-name">{p.name}</span>
                <span className="mono-meta">{p.dims}</span>
              </div>
            </div>
          ))}
          <button className="photo-add" onClick={onAddPhotos}>
            <Ic.plus size={20} />
            <span>Add</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Groups ───────────────────────────────────────────────────────────── */
const DUOS = [
  ["#1d4e6b", "#3b8fb8"],
  ["#3a2f5c", "#7d5fc4"],
  ["#5c3a2a", "#c08a52"],
  ["#234b3a", "#4fae84"],
  ["#4a2f3a", "#c46f93"],
  ["#2a3b5c", "#5f86c4"],
];
function groupAvatar(g) {
  return (
    <div
      className="g-avatar"
      style={{
        background: `linear-gradient(140deg, ${g.duo[0]}, ${g.duo[1]})`,
      }}
    >
      {g.label
        .replace(/[^A-Za-z]/g, "")
        .slice(0, 2)
        .toUpperCase() || "FB"}
    </div>
  );
}

const TYPE_PALETTE = [
  "#3a9be8",
  "#4fae84",
  "#d7a24c",
  "#9a7ee0",
  "#c46f93",
  "#5f86c4",
];

function GroupsPane({
  groups,
  setGroups,
  sel,
  setSel,
  folders,
  setFolders,
  dense,
  onOpen,
}) {
  const [q, setQ] = React.useState("");
  const [folder, setFolder] = React.useState("all");
  const [adding, setAdding] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [lbl, setLbl] = React.useState("");
  const [fol, setFol] = React.useState(folders[0]?.id || "");
  const [mgr, setMgr] = React.useState(false);

  const filtered = groups.filter(
    (g) =>
      (folder === "all" || g.folder === folder) &&
      (g.label + " " + g.url).toLowerCase().includes(q.toLowerCase()),
  );
  const visIds = filtered.map((g) => g.id);
  const selVis = visIds.filter((id) => sel.has(id));
  const allOn = visIds.length > 0 && selVis.length === visIds.length;

  const toggle = (id) => {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
  };
  const toggleAll = () => {
    const n = new Set(sel);
    if (allOn) visIds.forEach((id) => n.delete(id));
    else visIds.forEach((id) => n.add(id));
    setSel(n);
  };
  const removeG = (id) => {
    setGroups(groups.filter((g) => g.id !== id));
    const n = new Set(sel);
    n.delete(id);
    setSel(n);
  };
  const add = () => {
    if (!url.trim()) return;
    const id = "g" + Date.now();
    const m = url.match(/groups\/(\d+)/);
    setGroups([
      ...groups,
      {
        id,
        label: lbl.trim() || "New group",
        url: url.trim(),
        gid: m ? m[1] : "—",
        folder: fol,
        members: "—",
        duo: DUOS[groups.length % DUOS.length],
      },
    ]);
    setSel(new Set([...sel, id]));
    setUrl("");
    setLbl("");
    setAdding(false);
  };

  const folderCount = (fid) =>
    groups.filter((g) => fid === "all" || g.folder === fid).length;

  // ── group-type (folder) editing ──────────────────────────────────────────
  const addType = () => {
    const id = "f" + Date.now();
    const color = TYPE_PALETTE[folders.length % TYPE_PALETTE.length];
    setFolders([...folders, { id, name: "New type", short: "New type", color }]);
  };
  const renameType = (id, name) =>
    setFolders(
      folders.map((f) => (f.id === id ? { ...f, name, short: name } : f)),
    );
  const recolorType = (id, color) =>
    setFolders(folders.map((f) => (f.id === id ? { ...f, color } : f)));
  const delType = (id) => {
    const fallback = folders.find((f) => f.id !== id)?.id || "";
    setFolders(folders.filter((f) => f.id !== id));
    setGroups(
      groups.map((g) => (g.folder === id ? { ...g, folder: fallback } : g)),
    );
    if (folder === id) setFolder("all");
    if (fol === id) setFol(fallback);
  };

  return (
    <div className="pane">
      <div className="pane-head">
        <div className="eyebrow">Groups</div>
        <span className="count-chip accent">{sel.size} selected</span>
        <div style={{ flex: 1 }} />
        <button className="btn-ghost" onClick={toggleAll}>
          {allOn ? "Deselect all" : "Select all"}
        </button>
      </div>

      <div className="g-toolbar">
        <div className="field grow">
          <Ic.search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search groups…"
          />
          {q && (
            <button className="field-x" onClick={() => setQ("")}>
              <Ic.x size={13} w={2.2} />
            </button>
          )}
        </div>
        <button
          className={"btn-soft" + (adding ? " active" : "")}
          onClick={() => setAdding((a) => !a)}
        >
          <Ic.plus size={16} /> Add
        </button>
      </div>

      <div className="folder-row">
        <div className="folder-pills">
          <button
            className={"pill" + (folder === "all" ? " active" : "")}
            onClick={() => setFolder("all")}
          >
            All <span className="pill-n">{folderCount("all")}</span>
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              className={"pill" + (folder === f.id ? " active" : "")}
              onClick={() => setFolder(f.id)}
              title={f.name}
            >
              <span className="dot" style={{ background: f.color }} />
              <span className="pill-label">{f.name}</span>
              <span className="pill-n">{folderCount(f.id)}</span>
            </button>
          ))}
        </div>
        <button
          className={"pill ghost icon-only" + (mgr ? " active" : "")}
          onClick={() => setMgr((m) => !m)}
          title="Edit group types"
        >
          <Ic.pen size={14} />
        </button>
      </div>

      {mgr && (
        <div className="type-mgr">
          <div className="pop-label">Group types</div>
          {folders.map((f) => (
            <div key={f.id} className="type-row">
              <input
                type="color"
                className="type-color"
                value={f.color}
                onChange={(e) => recolorType(f.id, e.target.value)}
              />
              <input
                className="type-name"
                value={f.name}
                onChange={(e) => renameType(f.id, e.target.value)}
              />
              <span className="pill-n">{folderCount(f.id)}</span>
              <IconBtn
                icon={<Ic.trash size={14} />}
                label="Delete type"
                danger
                onClick={() => delType(f.id)}
              />
            </div>
          ))}
          <button className="pop-add" onClick={addType}>
            <Ic.plus size={14} /> Add type
          </button>
        </div>
      )}

      {adding && (
        <div className="add-form">
          <div className="field">
            <Ic.link size={15} />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.facebook.com/groups/…"
              autoFocus
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="field grow">
              <input
                value={lbl}
                onChange={(e) => setLbl(e.target.value)}
                placeholder="Label (optional)"
                style={{ paddingLeft: 12 }}
              />
            </div>
            <select
              className="select"
              value={fol}
              onChange={(e) => setFol(e.target.value)}
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button className="btn-accent sm" onClick={add}>
              Add group
            </button>
          </div>
        </div>
      )}

      <div className="g-list">
        {filtered.length === 0 && (
          <div className="empty">
            {groups.length === 0
              ? "No groups yet — click Add to paste a Facebook group URL."
              : `No groups match “${q}”.`}
          </div>
        )}
        {filtered.map((g) => {
          const on = sel.has(g.id);
          const f = folders.find((x) => x.id === g.folder) || {};
          return (
            <div
              key={g.id}
              className={"group-row" + (on ? " on" : "")}
              onClick={() => toggle(g.id)}
            >
              <Check on={on} onClick={() => toggle(g.id)} />
              {groupAvatar(g)}
              <div className="g-main">
                <div className="g-line1">
                  <span className="g-label">{g.label}</span>
                  <span className="g-folder" style={{ "--fc": f.color }}>
                    {f.short || "Unsorted"}
                  </span>
                </div>
                <div className="g-line2 mono-meta">
                  facebook.com/groups/{g.gid}
                  <span className="g-members"> · {g.members} members</span>
                </div>
              </div>
              <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                <IconBtn
                  icon={<Ic.ext size={15} />}
                  label="Open in Facebook"
                  onClick={() => onOpen && onOpen(g.url)}
                />
                <IconBtn
                  icon={<Ic.trash size={15} />}
                  label="Remove"
                  danger
                  onClick={() => removeG(g.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Run drawer ───────────────────────────────────────────────────────── */
const STATE_META = {
  queued: {
    label: "Queued",
    cls: "st-queued",
    icon: () => <Ic.clock size={13} />,
  },
  opening: {
    label: "Opening tab",
    cls: "st-run",
    icon: () => (
      <span className="spin">
        <Ic.refresh size={13} />
      </span>
    ),
  },
  filling: {
    label: "Filling…",
    cls: "st-run",
    icon: () => (
      <span className="spin">
        <Ic.refresh size={13} />
      </span>
    ),
  },
  ready: {
    label: "Ready to post",
    cls: "st-ready",
    icon: () => <Ic.check size={13} w={2.4} />,
  },
  failed: {
    label: "Auto-fill failed",
    cls: "st-fail",
    icon: () => <Ic.alert size={13} />,
  },
};
function RunDrawer({ open, onClose, runItems, done, total, onOpen }) {
  if (!open) return null;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const allDone = done >= total;
  return (
    <div className="drawer">
      <div className="drawer-head">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="eyebrow" style={{ margin: 0 }}>
            {allDone ? "Run complete" : "Filling groups"}
          </div>
          <span className="count-chip">
            {done}/{total} ready
          </span>
          {allDone && (
            <span className="ok-chip">
              <Ic.check size={12} w={2.6} /> Drafts staged — open each tab and
              press Post
            </span>
          )}
        </div>
        <IconBtn icon={<Ic.x size={16} />} label="Close" onClick={onClose} />
      </div>
      <div className="drawer-bar">
        <div className="drawer-bar-fill" style={{ width: pct + "%" }} />
      </div>
      <div className="run-list">
        {runItems.map((r) => {
          const m = STATE_META[r.state] || STATE_META.queued;
          return (
            <div key={r.id} className="run-row">
              <span className={"st " + m.cls}>
                {m.icon()} {m.label}
              </span>
              <span className="run-label">{r.label}</span>
              <span
                className="mono-meta"
                style={{ flex: 1, textAlign: "right" }}
              >
                {r.t || ""}
              </span>
              {(r.state === "ready" || r.state === "failed") && r.url && (
                <button
                  className={
                    "btn-ghost sm" + (r.state === "failed" ? " danger" : "")
                  }
                  onClick={() => onOpen && onOpen(r.url)}
                >
                  <Ic.ext size={13} /> Open
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { ComposePane, GroupsPane, RunDrawer, Check, IconBtn });
