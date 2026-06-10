const $ = (id) => document.getElementById(id);

let state = { caption: '', photos: [], groups: [] }; // groups: [{url,label,enabled}]
let loggedIn = false;

// ---- persistence ----
function persist() {
  // photos are not persisted (file paths may change); caption + groups are.
  window.api.saveSettings({ caption: state.caption, groups: state.groups });
}

async function init() {
  const saved = await window.api.loadSettings();
  state.caption = saved.caption || '';
  state.groups = Array.isArray(saved.groups) ? saved.groups : [];
  $('caption').value = state.caption;
  renderPhotos();
  renderGroups();
  refreshPostBtn();

  window.api.onProgress((line) => {
    const log = $('log');
    log.textContent += line + '\n';
    log.scrollTop = log.scrollHeight;
  });
}

// ---- caption ----
$('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  persist();
});

// ---- photos ----
function renderPhotos() {
  const ul = $('photo-list');
  ul.innerHTML = '';
  state.photos.forEach((p, i) => {
    const li = document.createElement('li');
    const name = p.split(/[\\/]/).pop();
    li.textContent = name;
    const x = document.createElement('span');
    x.className = 'x'; x.textContent = '×';
    x.onclick = () => { state.photos.splice(i, 1); renderPhotos(); refreshPostBtn(); };
    li.appendChild(x);
    ul.appendChild(li);
  });
}

$('add-photos').onclick = async () => {
  const files = await window.api.pickImages();
  for (const f of files) if (!state.photos.includes(f)) state.photos.push(f);
  renderPhotos();
  refreshPostBtn();
};

// ---- groups ----
function renderGroups() {
  const ul = $('group-list');
  ul.innerHTML = '';
  state.groups.forEach((g, i) => {
    const li = document.createElement('li');

    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = g.enabled !== false;
    cb.onchange = () => { state.groups[i].enabled = cb.checked; persist(); refreshPostBtn(); };

    const text = document.createElement('div');
    text.className = 'g-text';
    const lbl = document.createElement('div');
    lbl.className = 'g-label'; lbl.textContent = g.label || '(no label)';
    const url = document.createElement('div');
    url.className = 'g-url'; url.textContent = g.url;
    text.appendChild(lbl); text.appendChild(url);

    const x = document.createElement('span');
    x.className = 'x'; x.textContent = '×';
    x.onclick = () => { state.groups.splice(i, 1); renderGroups(); persist(); refreshPostBtn(); };

    li.appendChild(cb); li.appendChild(text); li.appendChild(x);
    ul.appendChild(li);
  });
}

function addGroup() {
  const urlEl = $('g-url');
  const labelEl = $('g-label');
  const url = urlEl.value.trim();
  if (!url) { urlEl.focus(); return; }
  state.groups.push({ url, label: labelEl.value.trim(), enabled: true });
  urlEl.value = '';
  labelEl.value = '';
  renderGroups();
  persist();
  refreshPostBtn();
  urlEl.focus();
}

$('add-group').onclick = addGroup;
$('g-url').addEventListener('keydown', (e) => { if (e.key === 'Enter') addGroup(); });
$('g-label').addEventListener('keydown', (e) => { if (e.key === 'Enter') addGroup(); });

// ---- actions ----
function selectedGroups() {
  return state.groups.filter((g) => g.enabled !== false);
}

function refreshPostBtn() {
  const ready = loggedIn && selectedGroups().length > 0 && state.photos.length > 0;
  $('btn-post').disabled = !ready;
}

$('btn-login').onclick = async () => {
  $('btn-login').disabled = true;
  $('status').textContent = 'Opening browser…';
  try {
    await window.api.startLogin();
    loggedIn = true;
    $('status').textContent = 'Login window open — log in, then run step 2';
    $('status').classList.add('ok');
  } catch (e) {
    $('status').textContent = 'Failed to open browser: ' + e.message;
  } finally {
    $('btn-login').disabled = false;
    refreshPostBtn();
  }
};

$('btn-post').onclick = async () => {
  const groups = selectedGroups().map((g) => g.url);
  $('btn-post').disabled = true;
  $('log').textContent = '';
  try {
    await window.api.runPost({ caption: state.caption, images: state.photos, groups });
  } catch (e) {
    $('log').textContent += 'Error: ' + e.message + '\n';
  } finally {
    refreshPostBtn();
  }
};

init();
