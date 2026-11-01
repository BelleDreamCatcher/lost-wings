/* Lost Wings – core helpers, default data, storage, sheets and sparkles */
(function () {
  'use strict';
  const LW = (window.LW = { views: {}, actions: {}, S: {}, tmp: {} });

  /* ---------- small helpers ---------- */
  LW.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  LW.uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const z = (n) => String(n).padStart(2, '0');
  LW.dkey = (d = new Date()) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  LW.today = () => LW.dkey();
  LW.parseD = (k) => {
    const [y, m, d] = String(k).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  LW.addDays = (k, n) => {
    const d = LW.parseD(k);
    d.setDate(d.getDate() + n);
    return LW.dkey(d);
  };
  LW.daysBetween = (a, b) => Math.round((LW.parseD(b) - LW.parseD(a)) / 864e5);
  LW.weekday = (k) => (LW.parseD(k).getDay() + 6) % 7; // Monday = 0
  LW.weekStart = (k) => LW.addDays(k, -LW.weekday(k));
  LW.DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  LW.DAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  LW.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  LW.fmtDate = (k, opts) => {
    if (!k) return '';
    const d = LW.parseD(k);
    return d.toLocaleDateString('en-GB', opts || { weekday: 'short', day: 'numeric', month: 'short' });
  };
  LW.ago = (k) => {
    if (!k) return 'not yet';
    const n = LW.daysBetween(k, LW.today());
    if (n <= 0) return 'today';
    if (n === 1) return 'yesterday';
    if (n < 14) return `${n} days ago`;
    if (n < 60) return `${Math.round(n / 7)} weeks ago`;
    return `${Math.round(n / 30)} months ago`;
  };
  LW.plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;
  LW.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  LW.byId = (arr, id) => (arr || []).find((x) => x.id === id);
  LW.move = (arr, id, dir) => {
    const i = arr.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };
  LW.remove = (arr, id) => {
    const i = arr.findIndex((x) => x.id === id);
    if (i >= 0) arr.splice(i, 1);
  };
  LW.c = (gentle, chaos) => (LW.state && LW.state.settings.chaosMode && chaos ? chaos : gentle);
  LW.name = () => (LW.state.settings.name || '').trim();

  /* ---------- palette ---------- */
  LW.PAL = {
    peach: ['var(--peach)', 'var(--peachM)', 'o'],
    pink: ['var(--pinkL)', 'var(--pinkD)', 'p'],
    yellow: ['var(--yel)', 'var(--yelM)', 'y'],
    sky: ['var(--sky)', 'var(--skyM)', 's'],
    mint: ['var(--mint)', 'var(--mintM)', 'm'],
    lavender: ['var(--lav)', 'var(--lavM)', ''],
  };
  LW.PAL_NAMES = Object.keys(LW.PAL);

  /* ---------- artwork ---------- */
  const WING_PATHS = [
    'M20 26 C10 26 4 22 8 18 C4 14 12 12 16 16 C14 10 20 12 20 18',
    'M20 24 C8 26 2 18 10 16 C6 10 16 10 20 18',
    'M20 22 C8 22 2 12 12 10 C10 4 20 6 20 16',
    'M20 20 C6 18 2 6 14 4 C20 4 22 10 20 18 M20 20 C30 22 38 16 32 12',
    'M20 22 C4 20 0 4 14 2 C20 2 22 10 20 20 M20 22 C36 20 40 4 26 2 C20 2 18 10 20 20',
  ];
  LW.wingSvg = (i, color) => {
    const p = LW.PAL[color] || LW.PAL.lavender;
    return `<svg viewBox="0 0 40 30" aria-hidden="true"><path d="${WING_PATHS[Math.max(0, Math.min(4, i))]}" fill="${p[0]}" stroke="${p[1]}" stroke-width="2" stroke-linejoin="round"/></svg>`;
  };

  const BUNNY_HEAD = `<ellipse cx="112" cy="95" rx="27" ry="72" transform="rotate(-10 112 95)" fill="#fff" stroke="#ee6cb0" stroke-width="6"/><ellipse cx="112" cy="102" rx="12" ry="48" transform="rotate(-10 112 102)" fill="#f9d6e8"/><ellipse cx="188" cy="95" rx="27" ry="72" transform="rotate(10 188 95)" fill="#fff" stroke="#ee6cb0" stroke-width="6"/><ellipse cx="188" cy="102" rx="12" ry="48" transform="rotate(10 188 102)" fill="#f9d6e8"/>`;
  const BUNNY_FACE = `<ellipse cx="150" cy="178" rx="80" ry="64" fill="#fff" stroke="#ee6cb0" stroke-width="6"/><circle cx="122" cy="174" r="7" fill="#3d4a7a"/><circle cx="178" cy="174" r="7" fill="#3d4a7a"/><ellipse cx="150" cy="190" rx="6" ry="4.5" fill="#ee6cb0"/><path d="M136 210 H164" stroke="#3d4a7a" stroke-width="5" stroke-linecap="round"/><path d="M98 196 l8 -6 M106 198 l8 -6 M114 200 l8 -6 M178 200 l8 -6 M186 198 l8 -6 M194 196 l8 -6" stroke="#f19cc9" stroke-width="3" stroke-linecap="round"/>`;
  LW.bunny = (w = 90, rumbled = false) =>
    `<svg class="bunny" style="width:${w}px" viewBox="20 0 260 410" aria-hidden="true">${BUNNY_HEAD}${
      rumbled
        ? '<ellipse cx="150" cy="295" rx="74" ry="85" fill="#fff" stroke="#ee6cb0" stroke-width="6"/><ellipse cx="150" cy="305" rx="40" ry="50" fill="#fff6fa"/><ellipse cx="90" cy="270" rx="16" ry="34" transform="rotate(18 90 270)" fill="#fff" stroke="#ee6cb0" stroke-width="6"/><ellipse cx="210" cy="270" rx="16" ry="34" transform="rotate(-18 210 270)" fill="#fff" stroke="#ee6cb0" stroke-width="6"/><ellipse cx="116" cy="378" rx="34" ry="17" fill="#fff" stroke="#ee6cb0" stroke-width="6"/><ellipse cx="184" cy="378" rx="34" ry="17" fill="#fff" stroke="#ee6cb0" stroke-width="6"/>'
        : '<ellipse cx="74" cy="262" rx="16" ry="34" transform="rotate(40 74 262)" fill="#fff" stroke="#ee6cb0" stroke-width="6"/><ellipse cx="226" cy="262" rx="16" ry="34" transform="rotate(-40 226 262)" fill="#fff" stroke="#ee6cb0" stroke-width="6"/><ellipse cx="150" cy="295" rx="74" ry="85" fill="#fff" stroke="#ee6cb0" stroke-width="6"/><ellipse cx="150" cy="305" rx="40" ry="50" fill="#fff6fa"/><ellipse cx="108" cy="380" rx="34" ry="17" fill="#fff" stroke="#ee6cb0" stroke-width="6"/><ellipse cx="192" cy="380" rx="34" ry="17" fill="#fff" stroke="#ee6cb0" stroke-width="6"/>'
    }${BUNNY_FACE}${rumbled ? '<path d="M214 128 q-10 16 0 20 q10 -4 0 -20 Z" fill="#c5e9fb" stroke="#90d9fd" stroke-width="3"/>' : ''}</svg>`;

  /* ---------- default data ---------- */
  const R = (name) => ({ id: LW.uid(), name });
  LW.defaults = function (examples = true) {
    const rooms = ['Bedroom', 'Bathroom', 'Kitchen', 'Living room', 'Hallway', 'Outside'].map(R);
    const room = (n) => (rooms.find((r) => r.name === n) || {}).id || '';
    const step = (text, r, season = 'all', low = false) => ({ id: LW.uid(), text, room: room(r), season, low });
    const ck = (text) => ({ id: LW.uid(), text, doneOn: '' });

    const d = {
      v: 1,
      onboarded: false,
      settings: {
        name: '',
        chaosMode: false,
        accent: 'pink',
        textSize: 'normal',
        reduceMotion: false,
        title: 'Queen',
        tools: { wing: true, routines: true, leave: true, audit: true, energy: true, people: true, chaos: true, wardrobe: true, shame: false, sparkles: true },
        todayCards: ['wing', 'routine', 'leave', 'energy', 'people', 'prep', 'wardrobe', 'jar'].map((id) => ({ id, on: true })),
      },
      meta: { visits: [], lastOpen: '' },
      wing: {
        states: [
          { id: 'w1', name: 'Crumpled', color: 'peach', msg: "Crumpled wings are still wings. Today is for the bare minimum, and that's enough.", low: true },
          { id: 'w2', name: 'Droopy', color: 'pink', msg: "That's allowed. Let's make today smaller and softer.", low: true },
          { id: 'w3', name: 'Flutter', color: 'yellow', msg: 'A little flutter. Pace yourself and keep a bit back for later.', low: false },
          { id: 'w4', name: 'Flying', color: 'sky', msg: 'Lovely. Enjoy the air under your wings.', low: false },
          { id: 'w5', name: 'Fluffed', color: 'mint', msg: 'Fully fluffed! Notice what helped, so Future You can do it again. ✦', low: false },
        ],
        tags: ['tired', 'social hangover', 'pain', 'hormones', 'sparkly', 'slept well', 'overwhelmed'],
        log: [],
      },
      slip: {
        title: 'Official permission slip',
        text: 'I am allowed to cancel plans, stay in pyjamas, eat the easy dinner and rest without explaining myself to anyone. Resting is not failing. Resting is how wings grow back.',
        used: [],
      },
      routines: {
        season: 'cold',
        seasonNames: { warm: 'Spring/Summer', cold: 'Autumn/Winter' },
        rooms,
        list: [],
        prep: [],
      },
      leave: { lists: [] },
      audit: {
        areas: [
          ['Mornings', 'routines'],
          ['Evenings and sleep', 'routines'],
          ['Getting out the door', 'leave'],
          ['Food and meals', 'routines'],
          ['Home and tidying', 'routines'],
          ['Clothes and laundry', 'wardrobe'],
          ['Money and life admin', 'chaos'],
          ['Social energy', 'energy'],
          ['Friendships and people', 'people'],
          ['Work or study', 'energy'],
          ['Rest and recovery', 'wing'],
          ['Being kind to myself', 'shame'],
        ].map(([name, tool]) => ({ id: LW.uid(), name, tool, state: 0 })),
        doneOn: '',
      },
      energy: {
        capacity: 10,
        hidden: { label: 'Work', days: [0, 1, 2, 3, 4] },
        rules: [
          { id: LW.uid(), kind: 'twoBig', text: 'Never two big social days in a row', on: true },
          { id: LW.uid(), kind: 'restAfter', text: 'A rest day after a big one', on: true },
          { id: LW.uid(), kind: 'workEvenings', text: "Rarely socialise after work, unless it's Friyay", on: true },
          { id: LW.uid(), kind: 'maxWeek', text: 'No more than this many social plans a week', on: false, n: 3 },
          { id: LW.uid(), kind: 'note', text: 'Breaks at work are alone time', on: true },
          { id: LW.uid(), kind: 'note', text: 'Saturday is the big social day', on: true },
          { id: LW.uid(), kind: 'note', text: 'Sunday is mostly rest', on: true },
        ],
        plans: [],
      },
      people: { list: [] },
      chaos: {
        types: [
          ['Snoozed four times', 'Try putting your meds and a glass of water by your phone, so getting up starts with one easy thing.'],
          ['Forgot keys/phone/purse', 'The handbag hard rule: everything goes back in the bag straight away. Or try a "Can I leave the house?" checklist.'],
          ['Cheese for dinner', 'Keep three no-thinking dinners on standby. Cheese counts as a food group in emergencies.'],
          ['"I won\'t forget" (forgot)', 'Future You is not a reliable notebook. Write it down or set a reminder the moment you think it.'],
          ['Ran late', 'Work backwards from the leaving time, and add a buffer for the Chaos Bunny.'],
          ['Lost something at home', 'Give things a home. Same place, every time.'],
          ['Overbooked myself', 'Check the yellow week before saying yes.'],
        ].map(([text, help]) => ({ id: LW.uid(), text, help })),
        reports: [],
      },
      shame: {
        acknowledged: false,
        tasks: [
          'Explore and split into themes',
          "Find evidence for what's true",
          'Creative ways to receive the truth',
          'Childhood shame',
          'Safer people',
          'Breathe through setbacks',
          'Fully meet this part of you',
        ].map((t) => ({ id: LW.uid(), title: t, done: false, journal: '' })),
        jar: [],
        stories: [],
        mantras: ['I see you, shame. Thank you for trying to protect me.', 'I am allowed to take up space.', 'Old story, new chapter.'],
        safe: [],
        crisis: [],
      },
      wardrobe: { styles: [], colours: [], materials: [], outfits: [], tomorrow: '' },
      sparkles: { earned: {}, custom: [] },
    };

    if (examples) {
      d.routines.list = [
        {
          id: LW.uid(),
          name: 'Morning routine',
          emoji: '🌅',
          time: '08:00',
          steps: [
            step('Meds', 'Bedroom', 'all', true),
            step('Get dressed', 'Bedroom', 'all', true),
            step('Shower, teeth, deodorant', 'Bathroom', 'all', true),
            step('Coffee', 'Kitchen', 'all', true),
            step('Protein shake', 'Kitchen'),
            step('Fuss the cat', 'Living room'),
            step('Get watch', 'Living room'),
            step('Coat and shoes', 'Hallway', 'all', true),
            step('Bag', 'Hallway', 'all', true),
            step('Unlock bike', 'Outside', 'warm'),
          ],
        },
        {
          id: LW.uid(),
          name: 'Evening routine',
          emoji: '🌙',
          time: '20:30',
          steps: [
            step('Pre-shower self-care', 'Bathroom'),
            step('Shower and teeth', 'Bathroom', 'all', true),
            step('Face and body care', 'Bathroom'),
            step('Active play with the cat', 'Living room', 'warm'),
            step('Treat toy for the cat', 'Living room', 'cold', true),
            step('Tea, journal, gratitude', 'Kitchen'),
            step('Blanket on the balcony, look at the moon', 'Outside', 'cold'),
            step('Phone on airplane mode', 'Bedroom', 'all', true),
          ],
        },
      ];
      d.routines.prep = ['Pick tomorrow\'s outfit', 'Pack the bag', 'Meds by the phone', 'Fill the water bottle'].map(ck);
      d.leave.lists = [
        { id: LW.uid(), name: 'Work', emoji: '💼', items: ['Keys', 'Phone', 'Purse', 'Lunch', 'Laptop and charger', 'Badge'].map(ck) },
        { id: LW.uid(), name: 'Cycling', emoji: '🚲', items: ['Helmet', 'Lights charged', 'Bike lock key', 'Rain jacket', 'Belt for the dress'].map(ck) },
        { id: LW.uid(), name: 'Doctor', emoji: '🩺', items: ['Appointment letter', 'List of questions', 'Meds list', 'Water and a snack'].map(ck) },
        { id: LW.uid(), name: 'Going out', emoji: '✨', items: ['Keys', 'Phone', 'Earplugs', 'Charger', 'Plan for getting home'].map(ck) },
      ];
      d.wardrobe.styles = [
        { id: LW.uid(), name: 'Pinafore', desc: 'Long-sleeved top or vest + leggings + whimsy socks' },
        { id: LW.uid(), name: 'Long dress', desc: 'Needs nothing else. Belt for cycling.' },
        { id: LW.uid(), name: 'Midi + leggings', desc: 'Colour-matched leggings' },
      ];
      d.wardrobe.colours = ['pastels', 'phoenix red', 'emerald green'];
      d.wardrobe.materials = ["wool that doesn't itch", 'soft cotton'];
      const [s1, s2, s3] = d.wardrobe.styles.map((s) => s.id);
      d.wardrobe.outfits = [
        ['Pinafore · lilac', s1, '🧥', 'lavender'],
        ['Long · blue', s2, '👗', 'sky'],
        ['Midi · green', s3, '👚', 'mint'],
        ['Pinafore · pink', s1, '🧥', 'pink'],
        ['Long · yellow', s2, '👗', 'yellow'],
        ['Midi · red', s3, '👚', 'peach'],
      ].map(([name, style, emoji, color]) => ({ id: LW.uid(), name, style, emoji, color, clean: true, notes: '' }));
    } else {
      d.routines.list = [
        { id: LW.uid(), name: 'Morning routine', emoji: '🌅', time: '08:00', steps: [] },
        { id: LW.uid(), name: 'Evening routine', emoji: '🌙', time: '20:30', steps: [] },
      ];
    }
    return d;
  };

  /* fill in keys added in later versions without touching user data */
  function fill(target, def) {
    for (const k of Object.keys(def)) {
      if (!(k in target)) target[k] = def[k];
      else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k]))
        fill(target[k], def[k]);
    }
    return target;
  }

  /* ---------- storage ---------- */
  const KEY = 'lostwings.v1';
  LW.load = function () {
    let s = null;
    try {
      s = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
      s = null;
    }
    LW.state = s ? fill(s, LW.defaults(false)) : LW.defaults(true);
    // make sure any new Today cards appear in the list
    const ids = LW.state.settings.todayCards.map((c) => c.id);
    for (const c of LW.defaults(false).settings.todayCards) if (!ids.includes(c.id)) LW.state.settings.todayCards.push(c);
  };
  let saveTimer = null;
  LW.save = function (now) {
    clearTimeout(saveTimer);
    const write = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify(LW.state));
      } catch (e) {
        LW.toast('Could not save. Your phone storage might be full.');
      }
    };
    if (now) write();
    else saveTimer = setTimeout(write, 250);
  };
  window.addEventListener('pagehide', () => LW.save(true));
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && LW.save(true));

  /* ---------- path binding: "people.list.#abc.name" ---------- */
  function resolve(root, path) {
    const parts = path.split('.');
    let o = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      o = p[0] === '#' ? (o || []).find((x) => x.id === p.slice(1)) : o ? o[p] : undefined;
      if (o == null) return [null, null];
    }
    return [o, parts[parts.length - 1]];
  }
  LW.setPath = (root, path, val) => {
    const [o, k] = resolve(root, path);
    if (o) o[k] = val;
  };
  LW.getPath = (root, path) => {
    const [o, k] = resolve(root, path);
    return o ? o[k] : undefined;
  };
  function readVal(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'number' || el.type === 'range') return el.value === '' ? '' : Number(el.value);
    return el.value;
  }

  /* ---------- toast ---------- */
  let toastTimer;
  LW.toast = function (msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  };

  /* ---------- sheets (bottom modal) ---------- */
  let sheetFn = null;
  LW.openSheet = function (fn, initial) {
    sheetFn = fn;
    LW.S = initial || {};
    document.getElementById('sheet-wrap').hidden = false;
    LW.renderSheet();
    const sh = document.getElementById('sheet');
    sh.scrollTop = 0;
    const f = sh.querySelector('[autofocus]');
    if (f) setTimeout(() => f.focus(), 60);
  };
  LW.renderSheet = function () {
    if (!sheetFn) return;
    const sh = document.getElementById('sheet');
    const top = sh.scrollTop;
    sh.innerHTML = '<div class="grab"></div>' + sheetFn(LW.S);
    sh.scrollTop = top;
  };
  LW.closeSheet = function () {
    sheetFn = null;
    LW.S = {};
    document.getElementById('sheet-wrap').hidden = true;
  };
  LW.sheetOpen = () => !!sheetFn;
  LW.actions.closeSheet = () => LW.closeSheet();

  /* ---------- re-render everything ---------- */
  LW.refresh = function () {
    LW.save();
    LW.render();
    if (sheetFn) LW.renderSheet();
  };

  /* ---------- global events ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const fn = LW.actions[el.dataset.act];
    if (!fn) return console.warn('No action', el.dataset.act);
    e.preventDefault();
    fn(el.dataset, el, e);
  });
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.bind && el.type !== 'checkbox' && el.tagName !== 'SELECT') {
      LW.setPath(LW.state, el.dataset.bind, readVal(el));
      LW.save();
    }
    if (el.dataset.sbind && el.type !== 'checkbox' && el.tagName !== 'SELECT' && el.type !== 'range') LW.S[el.dataset.sbind] = readVal(el);
    if (el.type === 'range' && el.dataset.sbind) {
      LW.S[el.dataset.sbind] = readVal(el);
      const out = document.getElementById(el.dataset.out || '');
      if (out) out.textContent = el.value;
    }
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.bind) {
      LW.setPath(LW.state, el.dataset.bind, readVal(el));
      LW.save();
    }
    if (el.dataset.sbind) LW.S[el.dataset.sbind] = readVal(el);
    if (el.dataset.change && LW.actions[el.dataset.change]) LW.actions[el.dataset.change](el.dataset, el, e);
    if ('rerender' in el.dataset) LW.refresh();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && LW.sheetOpen()) LW.closeSheet();
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter) {
      e.preventDefault();
      const fn = LW.actions[e.target.dataset.enter];
      if (fn) fn(e.target.dataset, e.target, e);
    }
  });

  /* ---------- reusable bits of UI ---------- */
  LW.back = (href, label = 'Back') => `<a class="back no-print" href="${href}">‹ ${LW.esc(label)}</a>`;
  LW.tick = (done, label, act, data = '', extra = '') =>
    `<div class="tick ${done ? 'done' : ''} ${extra}" role="checkbox" aria-checked="${done ? 'true' : 'false'}" tabindex="0" data-act="${act}" ${data}><i></i><span>${label}</span></div>`;
  LW.switch = (bind, checked, label, extra = '') =>
    `<label class="switch"><span>${label}</span><input type="checkbox" data-bind="${bind}" ${checked ? 'checked' : ''} ${extra}></label>`;
  LW.chipsSelect = (opts, value, act, key = 'v', cls = '') =>
    `<div class="chips">${opts
      .map(([v, label, c]) => `<button type="button" class="chip ${c || cls} ${String(v) === String(value) ? 'sel' : ''}" data-act="${act}" data-${key}="${LW.esc(v)}">${label}</button>`)
      .join('')}</div>`;
  LW.colorSelect = (value, act, data = '') =>
    `<div class="chips">${LW.PAL_NAMES.map(
      (n) =>
        `<button type="button" class="chip ${LW.PAL[n][2]} ${n === value ? 'sel' : ''}" style="background:${LW.PAL[n][0]}" data-act="${act}" data-color="${n}" ${data}>${n}</button>`
    ).join('')}</div>`;

  /* editable text list: list = array of strings at path */
  LW.stringListEditor = (path, list, addLabel = 'Add') => `
    ${list
      .map(
        (t, i) => `<div class="edit-row"><input type="text" value="${LW.esc(t)}" data-bind="${path}.${i}" aria-label="Item ${i + 1}">
      <button class="icon-btn" data-act="strDel" data-path="${path}" data-i="${i}" aria-label="Remove">✕</button></div>`
      )
      .join('')}
    <div class="edit-row"><input type="text" placeholder="${LW.esc(addLabel)}…" id="add-${path.replace(/\W/g, '_')}" data-enter="strAdd" data-path="${path}">
      <button class="icon-btn" data-act="strAdd" data-path="${path}" aria-label="Add">＋</button></div>`;
  LW.actions.strDel = (d) => {
    LW.getPath(LW.state, d.path).splice(Number(d.i), 1);
    LW.refresh();
  };
  LW.actions.strAdd = (d) => {
    const inp = document.getElementById('add-' + d.path.replace(/\W/g, '_'));
    const v = inp && inp.value.trim();
    if (!v) return;
    LW.getPath(LW.state, d.path).push(v);
    LW.refresh();
    const again = document.getElementById('add-' + d.path.replace(/\W/g, '_'));
    if (again) again.focus();
  };

  /* checklist items with a per-day tick (doneOn = date) */
  LW.isDoneToday = (item) => item.doneOn === LW.today();

  /* ---------- sparkles ---------- */
  LW.SPARKLES = [
    { id: 'first_wing', icon: '🪽', name: 'First wing check', desc: 'Checked in with your wings for the first time' },
    { id: 'fluffed', icon: '✨', name: 'Fully fluffed', desc: 'Your first fully fluffed wing check' },
    { id: 'came_back', icon: '✦', name: 'Came back', desc: 'Opened the app after a week or more away' },
    { id: 'rested', icon: '♡', name: 'Rested on purpose', desc: 'Used a permission slip' },
    { id: 'rumbled', icon: '🐰', name: 'Rumbled', desc: 'Filed your first Chaos Bunny report' },
    { id: 'forgave', icon: '🥕', name: 'Forgiven', desc: 'Forgave the Chaos Bunny' },
    { id: 'routine', icon: '☀', name: 'Routine run', desc: 'Finished a routine, start to end' },
    { id: 'low_wing', icon: '🌱', name: 'Gentle version', desc: 'Used a low-wing routine' },
    { id: 'out_door', icon: '🎒', name: 'Out the door', desc: 'Finished a leave-the-house checklist' },
    { id: 'said_no', icon: '✋', name: 'Said no', desc: 'Moved, shortened or cancelled a plan to protect your energy' },
    { id: 'connected', icon: '💌', name: 'Connected', desc: 'Logged time with someone' },
    { id: 'audit', icon: '🗺️', name: 'Mapped it', desc: 'Did a Chaos Audit' },
    { id: 'laundry', icon: '🧺', name: 'Laundry hero', desc: 'Did a laundry day' },
    { id: 'jar', icon: '🫙', name: 'Evidence', desc: 'Added to your compliments jar' },
    { id: 'personal', icon: '🎨', name: 'Made it mine', desc: 'Personalised something in the app' },
  ];
  LW.sparkle = function (id) {
    if (!LW.state.settings.tools.sparkles) return;
    const e = LW.state.sparkles.earned;
    if (e[id]) return;
    e[id] = LW.today();
    const s = LW.SPARKLES.find((x) => x.id === id);
    LW.save();
    setTimeout(() => LW.toast(`✦ New sparkle: ${s ? s.name : id}`), 350);
  };
  LW.sparkleCount = () => Object.keys(LW.state.sparkles.earned).length + LW.state.sparkles.custom.length;
  LW.CERT_NEEDED = 8;

  /* ---------- tool registry ---------- */
  LW.TOOLS = {
    wing: { name: 'Daily wing check', icon: '🪽', href: '#/wing' },
    routines: { name: 'Routines by room', icon: '🌅', href: '#/routines' },
    leave: { name: 'Can I leave the house?', icon: '🎒', href: '#/routines' },
    audit: { name: 'Chaos Audit', icon: '🗺️', href: '#/audit' },
    energy: { name: 'Social energy week', icon: '⚡', href: '#/energy' },
    people: { name: 'People and connection', icon: '💌', href: '#/people' },
    chaos: { name: 'Chaos Bunny log', icon: '🐰', href: '#/chaos' },
    wardrobe: { name: 'Capsule wardrobe', icon: '👗', href: '#/wardrobe' },
    shame: { name: 'Shame journey (heavier)', icon: '🫙', href: '#/shame' },
    sparkles: { name: 'Sparkles and certificate', icon: '✦', href: '#/me' },
  };
  LW.on = (tool) => !!LW.state.settings.tools[tool];
})();
