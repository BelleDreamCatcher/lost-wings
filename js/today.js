/* Lost Wings – Today, wing check, permission slip */
(function () {
  'use strict';
  const { esc } = LW;
  const A = LW.actions;

  /* ---------- wing helpers ---------- */
  LW.wingEntry = (k = LW.today()) => LW.state.wing.log.find((e) => e.date === k);
  LW.wingState = (id) => LW.byId(LW.state.wing.states, id);
  LW.wingIndex = (id) => LW.state.wing.states.findIndex((s) => s.id === id);
  LW.lowWingsToday = () => {
    const e = LW.wingEntry();
    const s = e && LW.wingState(e.state);
    return !!(s && s.low);
  };

  /* ---------- Today ---------- */
  const CARD_NAMES = {
    wing: 'Wing check',
    routine: 'Next routine',
    leave: 'Can I leave the house?',
    energy: 'Social energy this week',
    people: 'Someone you wanted closer',
    prep: 'Future You: prepare tonight',
    wardrobe: "Tomorrow's outfit",
    jar: 'Compliments jar',
  };
  LW.CARD_NAMES = CARD_NAMES;
  const CARD_TOOL = { wing: 'wing', routine: 'routines', leave: 'leave', energy: 'energy', people: 'people', prep: 'routines', wardrobe: 'wardrobe', jar: 'shame' };
  LW.CARD_TOOL = CARD_TOOL;

  const cards = {
    wing() {
      const e = LW.wingEntry();
      const s = e && LW.wingState(e.state);
      if (!s)
        return `<a class="c p" href="#/wing"><div class="lab">How are your wings?</div><div class="row"><span>Tap to check in</span><span class="sp"></span><span style="font-size:1.4rem">🪽</span></div></a>`;
      const i = LW.wingIndex(s.id);
      return `<a class="c p" href="#/wing/result"><div class="lab">Your wings today</div><div class="row"><span style="width:44px">${LW.wingSvg(i, s.color)}</span><b>${esc(s.name)}</b><span class="sp"></span><span class="tiny">change ›</span></div>${
        e.tags.length ? `<div class="tiny" style="margin-top:4px">${e.tags.map(esc).join(' · ')}</div>` : ''
      }</a>`;
    },
    routine() {
      const r = LW.nextRoutine();
      if (!r) return '';
      const low = LW.lowWingsToday();
      const steps = LW.routineSteps(r, low);
      return `<div class="c s"><div class="lab">Next up</div><div class="row"><b>${esc(r.emoji || '')} ${esc(r.name)}</b><span class="sp"></span><span class="tiny">${LW.plural(steps.length, 'step')}${r.time ? ' · ' + esc(r.time) : ''}</span></div>
        ${low ? '<div class="tiny" style="margin-top:4px">Low wings today, so this is the gentle version.</div>' : ''}
        <a class="btn" href="#/routine/${r.id}/run${low ? '?low=1' : ''}">Start</a></div>`;
    },
    leave() {
      const lists = LW.state.leave.lists;
      if (!lists.length) return '';
      return `<div class="c o"><div class="lab">Can I leave the house?</div><div class="chips">${lists
        .map((l) => `<a class="chip o" href="#/leave/${l.id}">${esc(l.emoji || '🎒')} ${esc(l.name)}</a>`)
        .join('')}</div></div>`;
    },
    energy() {
      const wk = LW.weekStart(LW.today());
      const f = LW.batteryFor(wk);
      const big = LW.biggestDay(wk);
      return `<a class="c y" href="#/energy"><div class="lab">Social energy this week</div><div class="bar"><b style="width:${Math.min(100, f.pct)}%;background:var(--yelM)"></b></div>
        <div class="tiny" style="margin-top:4px">${esc(f.label)}${big ? ` · ${LW.DAYS_LONG[LW.weekday(big)]} is your big one` : ''}</div></a>`;
    },
    people() {
      const due = LW.peopleDue();
      if (!due.length) return '';
      const p = due[0];
      return `<a class="c m" href="#/person/${p.id}"><div class="lab">Someone you wanted closer</div><div class="row">♡ ${esc(p.name)}<span class="sp"></span><span class="tiny">${esc(LW.ago(LW.lastSeen(p)))}</span></div></a>`;
    },
    prep() {
      if (new Date().getHours() < 16) return '';
      const prep = LW.state.routines.prep;
      if (!prep.length) return '';
      const done = prep.filter(LW.isDoneToday).length;
      return `<div class="c"><div class="lab">Future You: prepare tonight</div>${prep
        .map((it) => LW.tick(LW.isDoneToday(it), esc(it.text), 'prepTick', `data-id="${it.id}"`))
        .join('')}<div class="tiny">${done} of ${prep.length} ready for tomorrow</div></div>`;
    },
    wardrobe() {
      const w = LW.state.wardrobe;
      if (!w.outfits.length) return '';
      const o = LW.byId(w.outfits, w.tomorrow);
      return `<a class="c p" href="#/wardrobe"><div class="lab">Tomorrow's outfit</div>${
        o ? `<div class="row"><span style="font-size:1.4rem">${esc(o.emoji)}</span><b>${esc(o.name)}</b></div>` : '<div>Not picked yet. Tap to choose, or let the app pick.</div>'
      }</a>`;
    },
    jar() {
      const jar = LW.state.shame.jar;
      if (!jar.length) return '';
      return `<a class="c y" href="#/jar"><div class="lab">From your compliments jar</div>"${esc(LW.pick(jar).text)}"</a>`;
    },
  };

  LW.views.today = function () {
    const st = LW.state.settings;
    const h = new Date().getHours();
    const hi = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
    const nm = LW.name();
    const day = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
    const back = LW.tmp.welcomeBack;
    let html = `<h1>${hi}${nm ? ', ' + esc(nm) : ''} ✦</h1><p class="sub">${day} · ${LW.c('no pressure today', 'chaos is optional today')}</p>`;
    if (back)
      html += `<div class="c p fill-p center"><b>Welcome back ✦</b><div class="tiny">You've been away ${back} days. That's completely fine. Nothing is overdue.</div></div>`;
    for (const c of st.todayCards) {
      if (!c.on) continue;
      if (!LW.on(CARD_TOOL[c.id])) continue;
      if (c.id === 'people' && !LW.on('energy') && !LW.on('people')) continue;
      html += cards[c.id] ? cards[c.id]() : '';
    }
    if (LW.on('chaos')) html += `<a class="btn g" href="#/chaos/new">${LW.c('Chaos happened 🐰', 'Well, sh*t happened 🐰')}</a>`;
    if (LW.on('wing')) html += `<a class="btn g" href="#/slip">Open my permission slip ♡</a>`;
    html += `<p class="center tiny" style="margin-top:18px"><a href="#/settings/today">Arrange this screen</a></p>`;
    return html;
  };

  A.prepTick = (d) => {
    const it = LW.byId(LW.state.routines.prep, d.id);
    it.doneOn = LW.isDoneToday(it) ? '' : LW.today();
    LW.refresh();
  };

  /* ---------- Wing check ---------- */
  LW.views.wing = function () {
    const W = LW.state.wing;
    const e = LW.wingEntry();
    if (!LW.tmp.wing || LW.tmp.wing.date !== LW.today()) LW.tmp.wing = { date: LW.today(), state: e ? e.state : '', tags: e ? [...e.tags] : [], note: e ? e.note : '' };
    const t = LW.tmp.wing;
    const sel = LW.wingState(t.state);
    return `${LW.back('#/today')}
      <div class="hdr"><h1>How are your wings?</h1><button class="icon-btn" data-act="wingCustomise" aria-label="Personalise wings">✎</button></div>
      <p class="sub">No wrong answers</p>
      <div class="wings">${W.states
        .map(
          (s, i) =>
            `<button class="wing-opt ${t.state === s.id ? 'sel' : ''}" data-act="wingPick" data-id="${s.id}" aria-pressed="${t.state === s.id}">${LW.wingSvg(i, s.color)}<span>${esc(s.name)}</span></button>`
        )
        .join('')}</div>
      ${sel ? `<div class="c p center"><b>${esc(sel.name)}</b><div class="tiny">selected</div></div>` : ''}
      <div class="lab">Anything going on? (optional)</div>
      <div class="chips">${W.tags
        .map((g, i) => `<button class="chip ${['p', 's', 'y', 'm', 'o', ''][i % 6]} ${t.tags.includes(g) ? 'sel' : ''}" data-act="wingTag" data-tag="${esc(g)}">${esc(g)}</button>`)
        .join('')}<button class="chip w" data-act="wingAddTag">+ add</button></div>
      <div class="field" style="margin-top:12px"><input type="text" placeholder="One line, if you want…" value="${esc(t.note)}" id="wing-note" maxlength="200"></div>
      <button class="btn" data-act="wingSave" ${t.state ? '' : 'disabled'}>Save</button>
      ${LW.state.wing.log.length ? '<a class="btn g" href="#/wing/history">See my wings over time</a>' : ''}`;
  };
  A.wingPick = (d) => {
    LW.tmp.wing.note = (document.getElementById('wing-note') || {}).value || '';
    LW.tmp.wing.state = d.id;
    LW.render();
  };
  A.wingTag = (d) => {
    const t = LW.tmp.wing;
    t.note = (document.getElementById('wing-note') || {}).value || '';
    t.tags = t.tags.includes(d.tag) ? t.tags.filter((x) => x !== d.tag) : [...t.tags, d.tag];
    LW.render();
  };
  A.wingAddTag = () => {
    LW.tmp.wing.note = (document.getElementById('wing-note') || {}).value || '';
    LW.openSheet(
      () => `<h2>Add a tag</h2><div class="field"><input type="text" data-sbind="tag" autofocus placeholder="e.g. period, sunshine, deadline" data-enter="wingAddTagSave"></div>
      <button class="btn" data-act="wingAddTagSave">Add</button>`
    );
  };
  A.wingAddTagSave = () => {
    const v = (LW.S.tag || '').trim();
    if (v && !LW.state.wing.tags.includes(v)) LW.state.wing.tags.push(v);
    if (v && !LW.tmp.wing.tags.includes(v)) LW.tmp.wing.tags.push(v);
    LW.closeSheet();
    LW.sparkle('personal');
    LW.refresh();
  };
  A.wingSave = () => {
    const t = LW.tmp.wing;
    t.note = (document.getElementById('wing-note') || {}).value || '';
    if (!t.state) return;
    const log = LW.state.wing.log;
    const ex = LW.wingEntry();
    if (ex) Object.assign(ex, { state: t.state, tags: [...t.tags], note: t.note.trim() });
    else log.push({ date: LW.today(), state: t.state, tags: [...t.tags], note: t.note.trim() });
    log.sort((a, b) => (a.date < b.date ? -1 : 1));
    LW.sparkle('first_wing');
    if (LW.wingIndex(t.state) === LW.state.wing.states.length - 1) LW.sparkle('fluffed');
    LW.save();
    location.hash = '#/wing/result';
  };

  A.wingCustomise = () => {
    LW.openSheet(() => {
      const W = LW.state.wing;
      return `<h2>Personalise your wings</h2><p class="sub">Rename the five wing states, change their colours and the kind words you see.</p>
      ${W.states
        .map(
          (s, i) => `<div class="c"><div class="row"><span style="width:44px">${LW.wingSvg(i, s.color)}</span><input type="text" value="${esc(s.name)}" data-bind="wing.states.#${s.id}.name" aria-label="Wing state name"></div>
          <div class="field" style="margin-top:8px"><label>What you'll see</label><textarea data-bind="wing.states.#${s.id}.msg" style="min-height:60px">${esc(s.msg)}</textarea></div>
          ${LW.colorSelect(s.color, 'wingColor', `data-id="${s.id}"`)}
          <label class="switch"><span>Counts as a low-wing day (offers rest and gentle routines)</span><input type="checkbox" data-bind="wing.states.#${s.id}.low" ${s.low ? 'checked' : ''}></label></div>`
        )
        .join('')}
      <h2>Your tags</h2>${LW.stringListEditor('wing.tags', W.tags, 'New tag')}
      <button class="btn" data-act="sheetDone">Done</button>`;
    });
  };
  A.wingColor = (d) => {
    LW.byId(LW.state.wing.states, d.id).color = d.color;
    LW.sparkle('personal');
    LW.refresh();
  };
  A.sheetDone = () => {
    LW.closeSheet();
    LW.refresh();
  };

  LW.views.wingResult = function () {
    const e = LW.wingEntry();
    if (!e) {
      location.hash = '#/wing';
      return '';
    }
    const s = LW.wingState(e.state) || LW.state.wing.states[0];
    const i = LW.wingIndex(s.id);
    let html = `${LW.back('#/today', 'Today')}<div class="center wing-big">${LW.wingSvg(i, s.color)}</div>
      <h1 class="center">${esc(s.name)} wings today</h1><p class="sub center">${esc(s.msg)}</p>`;
    if (s.low) {
      html += `<div class="c p"><div class="lab">A little kindness</div>Your official permission slip is ready: rest without explaining.<a class="btn g" href="#/slip">Open permission slip</a></div>`;
      if (LW.on('routines')) {
        const r = LW.nextRoutine();
        if (r) {
          const n = LW.routineSteps(r, true).length,
            full = LW.routineSteps(r, false).length;
          html += `<div class="c s"><div class="lab">Smaller routine?</div>Use the low-wing ${esc(r.name.toLowerCase())}: ${n} steps instead of ${full}.<a class="btn g" href="#/routine/${r.id}/run?low=1">Use low-wing version</a></div>`;
        }
      }
      const rec = recovery(e.date);
      if (rec) html += `<div class="c m"><div class="lab">Remember</div>${rec}</div>`;
    } else {
      html += `<div class="c m"><div class="lab">Notice what's helping</div>Jot down what's lifting your wings, so Future You can find it again.</div>`;
    }
    html += `<a class="btn g" href="#/wing">Change today's check-in</a><a class="btn g" href="#/wing/history">See my wings over time</a>`;
    return html;
  };

  function recovery(today) {
    // find the last earlier low day, then how long until a non-low day
    const log = LW.state.wing.log.filter((e) => e.date < today);
    for (let i = log.length - 1; i >= 0; i--) {
      const s = LW.wingState(log[i].state);
      if (s && s.low) {
        const after = log.slice(i + 1).find((x) => {
          const t = LW.wingState(x.state);
          return t && !t.low;
        });
        if (after) {
          const n = LW.daysBetween(log[i].date, after.date);
          return `Last time your wings were low, they were ${esc(LW.wingState(after.state).name.toLowerCase())} again within ${LW.plural(n, 'day')}.`;
        }
        return '';
      }
    }
    return '';
  }

  LW.views.wingHistory = function () {
    const W = LW.state.wing;
    const base = LW.tmp.wingMonth || LW.today().slice(0, 7);
    const [y, m] = base.split('-').map(Number);
    const first = `${y}-${String(m).padStart(2, '0')}-01`;
    const days = new Date(y, m, 0).getDate();
    const pad = LW.weekday(first);
    const map = {};
    W.log.forEach((e) => (map[e.date] = e));
    let cells = LW.DAYS.map((d) => `<span class="h">${d[0]}</span>`).join('') + '<span></span>'.repeat(pad);
    for (let d = 1; d <= days; d++) {
      const k = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const e = map[k];
      const s = e && LW.wingState(e.state);
      const bg = s ? (LW.PAL[s.color] || LW.PAL.lavender)[0] : '#f1f1f7';
      cells += `<span class="d ${k === LW.today() ? 'today' : ''}" style="background:${bg}" title="${s ? esc(s.name) : ''}">${d}</span>`;
    }
    const pats = patterns();
    return `${LW.back('#/wing')}
      <div class="hdr"><button class="icon-btn" data-act="wingMonth" data-dir="-1" aria-label="Previous month">‹</button><h1 class="center">${LW.MONTHS[m - 1]} ${y}</h1><button class="icon-btn" data-act="wingMonth" data-dir="1" aria-label="Next month">›</button></div>
      <p class="sub center">Your wings this month</p>
      <div class="cal">${cells}</div>
      <div class="chips" style="margin:10px 0">${W.states.map((s) => `<span class="chip static ${LW.PAL[s.color][2]}" style="background:${LW.PAL[s.color][0]}">${esc(s.name)}</span>`).join('')}</div>
      <p class="tiny">Grey days are just days you didn't check in. Nothing missed.</p>
      ${pats}`;
  };
  A.wingMonth = (d) => {
    const base = LW.tmp.wingMonth || LW.today().slice(0, 7);
    let [y, m] = base.split('-').map(Number);
    m += Number(d.dir);
    if (m < 1) (m = 12), y--;
    if (m > 12) (m = 1), y++;
    LW.tmp.wingMonth = `${y}-${String(m).padStart(2, '0')}`;
    LW.render();
  };

  function patterns() {
    const W = LW.state.wing;
    const log = W.log.slice(-90);
    if (log.length < 5) return `<div class="c y"><div class="lab">Gentle patterns</div>After a few more check-ins, gentle patterns will show up here.</div>`;
    const n = W.states.length;
    const score = (e) => LW.wingIndex(e.state) / (n - 1);
    const by = Array.from({ length: 7 }, () => []);
    log.forEach((e) => by[LW.weekday(e.date)].push(score(e)));
    const avg = by.map((a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null));
    const valid = avg.map((v, i) => [v, i]).filter(([v]) => v != null);
    valid.sort((a, b) => b[0] - a[0]);
    let html = '';
    if (valid.length >= 3) {
      const best = valid[0][1],
        worst = valid[valid.length - 1][1];
      html += `<div class="c m"><div class="lab">Fluffiest days</div>${LW.DAYS_LONG[best]}s.${best === 4 ? ' Friyay is real. ✦' : ''}</div>`;
      if (worst !== best) html += `<div class="c y"><div class="lab">Gentle pattern</div>${LW.DAYS_LONG[worst]}s are often a bit lower. Maybe plan something soft for them.</div>`;
    }
    const tagScore = {};
    log.forEach((e) => e.tags.forEach((t) => (tagScore[t] = tagScore[t] || []).push(score(e))));
    const tagLines = Object.entries(tagScore)
      .filter(([, a]) => a.length >= 2)
      .map(([t, a]) => [t, a.reduce((x, y) => x + y, 0) / a.length, a.length])
      .sort((a, b) => b[2] - a[2])
      .slice(0, 4)
      .map(([t, v, c]) => `<div class="row tiny"><span>${esc(t)} (${c})</span><span class="sp"></span><span>${v > 0.6 ? 'wings usually up' : v < 0.4 ? 'wings usually low' : 'mixed'}</span></div>`)
      .join('');
    if (tagLines) html += `<div class="c s"><div class="lab">Your tags</div>${tagLines}</div>`;
    return html;
  }

  /* ---------- Permission slip ---------- */
  LW.views.slip = function () {
    const sl = LW.state.slip;
    const nm = LW.name() || 'me';
    if (LW.tmp.slipEdit)
      return `${LW.back('#/today')}<h1>Edit your permission slip</h1>
        <div class="field"><label>Title</label><input type="text" value="${esc(sl.title)}" data-bind="slip.title"></div>
        <div class="field"><label>Your permission</label><textarea data-bind="slip.text" style="min-height:160px">${esc(sl.text)}</textarea></div>
        <button class="btn" data-act="slipEdit">Done</button>`;
    return `${LW.back('#/today')}
      <div class="c p fill-p printable" style="padding:22px 18px;margin-top:6px">
        <div class="center" style="font-size:1.8rem">♡</div>
        <h1 class="center">${esc(sl.title)}</h1>
        <p class="center tiny">Issued to ${esc(nm)} · ${LW.fmtDate(LW.today(), { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="font-size:1.05rem">${esc(sl.text).replace(/\n/g, '<br>')}</p>
        <p class="center" style="color:var(--pinkD);letter-spacing:5px">✦ ♡ ✦</p>
      </div>
      <button class="btn" data-act="slipUse">I'm using it today</button>
      <button class="btn g" data-act="slipEdit">Edit the wording</button>
      ${sl.used.length ? `<p class="tiny center">Used ${LW.plural(sl.used.length, 'time')}. Every one of them was a good decision.</p>` : ''}`;
  };
  A.slipEdit = () => {
    LW.tmp.slipEdit = !LW.tmp.slipEdit;
    if (!LW.tmp.slipEdit) LW.sparkle('personal');
    LW.render();
  };
  A.slipUse = () => {
    const sl = LW.state.slip;
    if (!sl.used.includes(LW.today())) sl.used.push(LW.today());
    LW.sparkle('rested');
    LW.toast('Rest is officially approved ♡');
    LW.refresh();
  };
})();
