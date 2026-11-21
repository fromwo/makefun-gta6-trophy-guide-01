// Leonida Platinum — the GTA VI trophy tracker. Everything runs offline: the trophy list is
// fetched once from this app's own data/trophies.json, progress lives in localStorage, and
// nothing is ever sent over the network.
const KEY = 'gta6-trophy-progress-v1';
const SETTINGS_KEY = 'gta6-trophy-settings-v1';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const sourceUrls = new Map((doc.sources ?? []).map((s) => [s.name, s.url]));
// The short labels stored beside each trophy map to the full source links above.
const sourceLink = (label) => {
  const url = sourceUrls.get(label);
  return url ? { label, url } : { label, url: null };
};

const ROADMAP = [
  {
    stage: 'Stage 1',
    title: 'Story first — Chapters 1 to 4',
    text: 'Play the story straight through and keep a separate save before every named story mission. This stage earns the opening mission, all four chapter trophies, the seven named-mission trophies and the finale — the backbone of the platinum.',
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    stage: 'Stage 2',
    title: 'Side strands — Andy, Kenton, Billy, Randy, Tyrone and the strangers',
    text: 'After the story opens the map up, follow the contact strands to their final missions and complete eight stranger strands across Leonida. These are all available in free roam, so there is no rush — but do them before the clean-up so nothing is left half-finished.',
    ids: [22, 23, 24, 25, 26, 27],
  },
  {
    stage: 'Stage 3',
    title: 'Activities — races, range, fishing, arcade, meditation and hunting',
    text: 'Sample every activity type, then grind the counted ones: 250 stunts, gold medals in every Shooting Range challenge, wins in 20 different races and a drone race at every location, a fishing win over Cal, an arcade game, meditation at every spot, and Bret’s unique animal. Do the fun ones first; the shooting range golds take the longest.',
    ids: [15, 16, 17, 18, 19, 20, 21, 28, 29, 32],
  },
  {
    stage: 'Stage 4',
    title: 'Open-world feats and collectibles',
    text: 'The big open-world sweep: 100 vehicles discovered, all 52 areas explored, three card sets completed, WAiNK It at 100 locations, all 8 garages bought, 10 vehicles registered, and the robbery and wanted-level feats — five bank vaults, one armored truck, one illegal operation per gang, three shops back-to-back with your partner, and the rest of the one-off moments.',
    ids: [30, 31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55],
  },
  {
    stage: 'Stage 5',
    title: 'Clean-up — 100% completion and the platinum',
    text: 'Check the in-game stats screen for what is still missing, finish the last challenges and collectibles, and the gold for 100% completion pops — and with it, the platinum. Nothing in this stage is missable.',
    ids: [1, 14],
  },
];

let earned = new Set();
try {
  const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
  earned = new Set((Array.isArray(raw) ? raw : []).filter((id) => trophies.some((t) => t.id === id)));
} catch {
  earned = new Set();
}
let settings = { spoiler: false };
try {
  settings = { spoiler: false, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
} catch {
  settings = { spoiler: false };
}

const $ = (id) => document.getElementById(id);
const cardsEl = $('cards');
const searchEl = $('search');
const kindEl = $('kind');
const gradeEl = $('grade');
const missableOnlyEl = $('missableOnly');
const hideEarnedEl = $('hideEarned');
const spoilerEl = $('spoiler');

spoilerEl.checked = settings.spoiler;

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function gradeLetter(grade) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] ?? '?';
}

function trophyIsHidden(t) {
  return settings.spoiler && t.kind === 'story' && !earned.has(t.id);
}

function renderProgress() {
  const total = trophies.length;
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] ?? { got: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (earned.has(t.id)) byGrade[t.grade].got += 1;
  }
  const missable = trophies.filter((t) => t.missable);
  const missableGot = missable.filter((t) => earned.has(t.id)).length;
  $('earnedCount').textContent = earned.size;
  $('progressText').textContent = `${earned.size} of ${total} earned`;
  $('progressFill').style.width = `${Math.round((earned.size / total) * 100)}%`;
  $('progressBar').setAttribute('aria-valuenow', String(earned.size));
  $('gradeLine').textContent =
    `Platinum ${byGrade.platinum?.got ?? 0}/${byGrade.platinum?.total ?? 0} · ` +
    `Gold ${byGrade.gold?.got ?? 0}/${byGrade.gold?.total ?? 0} · ` +
    `Silver ${byGrade.silver?.got ?? 0}/${byGrade.silver?.total ?? 0} · ` +
    `Bronze ${byGrade.bronze?.got ?? 0}/${byGrade.bronze?.total ?? 0}`;
  $('missableLine').textContent = `Missable trophies earned: ${missableGot} of ${missable.length}`;
}

function renderRoadmap() {
  const list = $('roadmapList');
  list.replaceChildren();
  for (const stage of ROADMAP) {
    const got = stage.ids.filter((id) => earned.has(id)).length;
    const li = document.createElement('li');
    const h3 = document.createElement('h3');
    const tag = document.createElement('span');
    tag.className = 'stage-tag';
    tag.textContent = stage.stage;
    h3.append(tag, document.createTextNode(stage.title));
    const p = document.createElement('p');
    p.textContent = stage.text;
    const names = stage.ids
      .map((id) => trophies.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => t.name)
      .join(' · ');
    const trophiesP = document.createElement('p');
    trophiesP.className = 'stage-trophies';
    trophiesP.textContent = `Trophies: ${names}`;
    const progress = document.createElement('p');
    progress.className = 'stage-progress';
    progress.textContent = `${got} of ${stage.ids.length} earned in this stage`;
    li.append(h3, p, trophiesP, progress);
    list.append(li);
  }
}

function renderSources() {
  const list = $('sourceList');
  list.replaceChildren();
  for (const s of doc.sources ?? []) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = s.name;
    li.append(a);
    list.append(li);
  }
}

function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kindEl.value === 'missable' && !t.missable) return false;
    if (kindEl.value === 'online' && t.kind !== 'online') return false;
    if (kindEl.value !== 'all' && kindEl.value !== 'missable' && kindEl.value !== 'online' && t.kind !== kindEl.value) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (missableOnlyEl.checked && !t.missable) return false;
    if (hideEarnedEl.checked && earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderCards() {
  const list = visibleTrophies();
  cardsEl.replaceChildren();
  $('onlineEmpty').classList.toggle('hidden', kindEl.value !== 'online');
  $('onlineNote').classList.toggle('hidden', kindEl.value === 'online');
  $('spoilerNote').classList.toggle('hidden', !settings.spoiler);
  $('resultCount').textContent =
    list.length === trophies.length
      ? `Showing all ${trophies.length} trophies`
      : `Showing ${list.length} of ${trophies.length} trophies`;
  for (const t of list) {
    const hidden = trophyIsHidden(t);
    const card = document.createElement('article');
    card.className = 'card' + (earned.has(t.id) ? ' earned' : '');
    const top = document.createElement('div');
    top.className = 'card-top';
    const medal = document.createElement('span');
    medal.className = `medal ${t.grade}`;
    medal.textContent = gradeLetter(t.grade);
    medal.title = t.grade;
    const name = document.createElement('h3');
    name.textContent = hidden ? 'Hidden story trophy' : t.name;
    top.append(medal, name);
    const official = document.createElement('p');
    official.className = 'official';
    official.textContent = hidden ? 'Earn this trophy to reveal its official description.' : t.description;
    const flags = document.createElement('div');
    flags.className = 'flags';
    for (const [text, cls] of [
      [t.grade, ''],
      [t.kind, ''],
      ...(t.missable ? [['Missable', 'missable']] : []),
      ...(earned.has(t.id) ? [['Earned', 'earned-flag']] : []),
    ]) {
      const span = document.createElement('span');
      span.className = `flag ${cls}`.trim();
      span.textContent = text;
      flags.append(span);
    }
    const guide = document.createElement('p');
    guide.className = 'guide';
    // Each guide ends with a "Sources: ..." sentence in the data; the card renders
    // the same sources as links just below, so the sentence is dropped from the
    // displayed text to avoid showing the list twice. Search still uses the full text.
    const guideText = hidden
      ? 'Spoiler-free mode is on. Tick this trophy off once you have earned it in the game to see its guide.'
      : t.guide.replace(/\s*Sources: [^.]*\.\s*$/, '');
    guide.textContent = guideText;
    const sources = document.createElement('p');
    sources.className = 'sources';
    if (hidden) {
      sources.textContent = 'Sources hidden with the trophy.';
    } else {
      sources.append(document.createTextNode('Sources: '));
      (t.sources ?? []).forEach((label, i) => {
        if (i > 0) sources.append(document.createTextNode('; '));
        const link = sourceLink(label);
        if (link.url) {
          const a = document.createElement('a');
          a.href = link.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = link.label;
          sources.append(a);
        } else {
          sources.append(document.createTextNode(link.label));
        }
      });
    }
    const foot = document.createElement('div');
    foot.className = 'card-foot';
    const tick = document.createElement('label');
    tick.className = 'tick';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${hidden ? 'hidden story trophy' : t.name} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      save();
      renderAll();
    });
    tick.append(box, document.createTextNode(earned.has(t.id) ? 'Earned' : 'Mark as earned'));
    foot.append(tick);
    card.append(top, official, flags, guide, sources, foot);
    cardsEl.append(card);
  }
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderCards();
}

$('exportBtn').addEventListener('click', () => {
  const payload = {
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const raw = Array.isArray(data) ? data : data.earned ?? [];
    const ids = raw
      .map((v) => (typeof v === 'number' ? v : trophies.find((t) => t.name === v)?.id))
      .filter((id) => typeof id === 'number' && trophies.some((t) => t.id === id));
    if (!ids.length && raw.length) throw new Error('no recognised trophies');
    earned = new Set(ids);
    save();
    renderAll();
    $('savedNote').textContent = `Imported ${ids.length} earned trophies. Progress saves automatically in this browser (localStorage).`;
  } catch {
    $('savedNote').textContent = 'That file could not be imported. Export a progress file from this guide and import that file.';
  }
  e.target.value = '';
});

$('resetBtn').addEventListener('click', () => {
  if (!earned.size) return;
  if (window.confirm('Clear all earned ticks? This only clears this browser’s saved progress.')) {
    earned = new Set();
    save();
    renderAll();
  }
});

for (const el of [searchEl, kindEl, gradeEl, missableOnlyEl, hideEarnedEl]) {
  el.addEventListener('input', renderCards);
}
spoilerEl.addEventListener('change', () => {
  settings.spoiler = spoilerEl.checked;
  save();
  renderAll();
});

renderSources();
renderAll();
document.documentElement.dataset.ready = 'true';
