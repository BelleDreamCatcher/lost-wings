/* Lost Wings – social energy week, energy rules, people and connection admin */
(function () {
  'use strict';
  const { esc } = LW;
  const A = LW.actions;

  const COST = { sip: 1, gulp: 2, drain: 3 };
  const COST_LABEL = { sip: '☕ sip', gulp: '🥤 gulp', drain: '🪫 drain' };
  const BIG = 3;

  const plans = () => LW.state.energy.plans;
  const socialOn = (date, excludeId) => plans().filter((p) => p.date === date && p.kind === 'social' && p.id !== excludeId);
  const dayCost = (date, excludeId) => socialOn(date, excludeId).reduce((n, p) => n + (COST[p.cost] || 1), 0);
  LW.batteryFor = (wk) => {
    let used = 0;
    for (let i = 0; i < 7; i++) used += dayCost(LW.addDays(wk, i));
    const cap = Math.max(1, Number(LW.state.energy.capacity) || 10);
    const pct = Math.round((used / cap) * 100);
    const label =
      pct === 0 ? 'Wide open week' : pct < 40 ? `${pct}% · plenty in the tank` : pct < 75 ? `${pct}% · comfortable` : pct <= 100 ? `${pct}% · busy but doable` : `${pct}% · more than your battery holds`;
    return { used, cap, pct, label };
  };
  LW.biggestDay = (wk) => {
    let best = null,
      n = 0;
    for (let i = 0; i < 7; i++) {
      const k = LW.addDays(wk, i);
      const c = dayCost(k);
      if (c > n) (n = c), (best = k);
    }
    return n >= BIG ? best : null;
  };

  /* returns a list of gentle heads-ups for a plan (not yet saved, or being edited) */
  LW.checkPlan = (p) => {
    if (!p.date || p.kind !== 'social') return [];
    const E = LW.state.energy;
    const out = [];
    const mine = COST[p.cost] || 1;
    const today = dayCost(p.date, p.id) + mine;
    const prev = dayCost(LW.addDays(p.date, -1), p.id);
    const next = dayCost(LW.addDays(p.date, 1), p.id);
    for (const r of E.rules) {
      if (!r.on) continue;
      if (r.kind === 'twoBig' && today >= BIG && (prev >= BIG || next >= BIG)) {
        const other = prev >= BIG ? LW.addDays(p.date, -1) : LW.addDays(p.date, 1);
        out.push(`${LW.DAYS_LONG[LW.weekday(other)]} is already a big day, and your rule is "${r.text}".`);
      }
      if (r.kind === 'restAfter' && today >= BIG && next > 0) out.push(`This makes ${LW.DAYS_LONG[LW.weekday(p.date)]} a big day, and the day after already has plans. Your rule: "${r.text}".`);
      if (r.kind === 'restAfter' && prev >= BIG) out.push(`The day before is a big one. Your rule: "${r.text}".`);
      if (r.kind === 'workEvenings' && E.hidden.days.includes(LW.weekday(p.date)) && LW.weekday(p.date) !== 4 && p.time && p.time >= '17:00')
        out.push(`That's after ${esc(E.hidden.label.toLowerCase() || 'work')} on a ${LW.DAYS_LONG[LW.weekday(p.date)]}. Your rule: "${r.text}".`);
      if (r.kind === 'maxWeek') {
        const wk = LW.weekStart(p.date);
        let n = 1;
        for (let i = 0; i < 7; i++) n += socialOn(LW.addDays(wk, i), p.id).length;
        if (n > (Number(r.n) || 3)) out.push(`That would be ${n} social plans this week. Your limit is ${Number(r.n) || 3}.`);
      }
    }
    const wk = LW.weekStart(p.date);
    let used = mine;
    for (let i = 0; i < 7; i++) used += dayCost(LW.addDays(wk, i), p.id);
    if (used > (Number(E.capacity) || 10)) out.push(`This week would go over your battery (${used} of ${E.capacity}).`);
    return out;
  };

  /* ---------- Energy tab ---------- */
  LW.views.energy = function () {
    const E = LW.state.energy;
    const wk = LW.weekStart(LW.addDays(LW.today(), 7 * (LW.tmp.weekOffset || 0)));
    let html = `<div class="hdr"><h1>Energy</h1><a class="icon-btn" href="#/energy/rules" aria-label="My energy rules">⚙︎</a></div>`;
    if (LW.on('energy')) {
      const f = LW.batteryFor(wk);
      const cols = [];
      for (let i = 0; i < 7; i++) {
        const k = LW.addDays(wk, i);
        const ps = plans().filter((p) => p.date === k);
        const hidden = E.hidden.days.includes(i) && E.hidden.label;
        let blocks = hidden ? `<i class="blk hidden-e" style="flex:3" title="${esc(E.hidden.label)}"></i>` : '';
        blocks += ps
          .map((p) => `<i class="blk ${p.kind === 'rest' ? 'k-rest' : p.kind === 'hidden' ? 'hidden-e' : 'k-social'}" style="flex:${p.kind === 'rest' ? 3 : (COST[p.cost] || 1) + 0.5}">${esc(p.title)}</i>`)
          .join('');
        cols.push(`<div class="col ${k === LW.today() ? 'today' : ''}" data-act="dayOpen" data-date="${k}" role="button" aria-label="${LW.DAYS_LONG[i]}"><span class="dn">${LW.DAYS[i]}<br>${LW.parseD(k).getDate()}</span>${blocks}<i class="free"></i></div>`);
      }
      const label = (LW.tmp.weekOffset || 0) === 0 ? 'This week' : (LW.tmp.weekOffset === 1 ? 'Next week' : LW.tmp.weekOffset === -1 ? 'Last week' : `Week of ${LW.fmtDate(wk)}`);
      html += `<div class="hdr"><button class="icon-btn" data-act="weekNav" data-dir="-1" aria-label="Previous week">‹</button><h2 class="center" style="flex:1;margin:8px 0">${label}</h2><button class="icon-btn" data-act="weekNav" data-dir="1" aria-label="Next week">›</button></div>
        <div class="lab">Social battery forecast</div>
        <div class="bar" style="height:12px"><b style="width:${Math.min(100, f.pct)}%;background:${f.pct > 100 ? 'var(--peachM)' : 'var(--yelM)'}"></b></div>
        <div class="tiny" style="margin:4px 0 10px">${esc(f.label)}</div>
        <div class="week">${cols.join('')}</div>
        <div class="legend"><span><i class="k-social"></i>social</span><span><i class="k-rest"></i>rest</span><span><i class="hidden-e"></i>hidden energy</span></div>`;
      // rest suggestions after big days
      const sugg = [];
      for (let i = 0; i < 7; i++) {
        const k = LW.addDays(wk, i);
        const nk = LW.addDays(k, 1);
        if (dayCost(k) >= BIG && !plans().some((p) => p.date === nk && p.kind === 'rest') && dayCost(nk) === 0)
          sugg.push(`<div class="c m"><div class="lab">Rest after a big one?</div>${LW.DAYS_LONG[i]} is a big day. Pop some rest on ${LW.DAYS_LONG[(i + 1) % 7]}?<button class="btn sm g" data-act="addRest" data-date="${nk}">Add rest</button></div>`);
      }
      html += sugg.join('');
      const wkPlans = plans().filter((p) => p.date >= wk && p.date <= LW.addDays(wk, 6)).sort((a, b) => (a.date + (a.time || '') < b.date + (b.time || '') ? -1 : 1));
      const love = wkPlans.filter((p) => p.kind === 'social' && p.feel === 'love').length;
      const obl = wkPlans.filter((p) => p.kind === 'social' && p.feel === 'obligated').length;
      html += `<button class="btn" data-act="planNew" data-date="${LW.today() >= wk && LW.today() <= LW.addDays(wk, 6) ? LW.today() : wk}">+ Add a plan</button>`;
      if (wkPlans.length) {
        html += `<h2>Plans</h2>${love + obl ? `<p class="tiny">♡ ${love} you love · ${obl} you feel obligated to</p>` : ''}`;
        html += wkPlans.map(planCard).join('');
      }
    }
    if (LW.on('people')) {
      html += `<h2>My people</h2>`;
      const due = LW.peopleDue();
      if (due.length) html += due.slice(0, 2).map((p) => `<a class="c p" href="#/person/${p.id}"><div class="lab">Gentle nudge</div>It's been ${esc(LW.ago(LW.lastSeen(p)).replace(' ago', ''))} since you saw ${esc(p.name)}.</a>`).join('');
      html += `<a class="btn g" href="#/people">Open my people</a>`;
    }
    if (!LW.on('energy') && !LW.on('people')) html += '<p class="empty">Energy tools are switched off. Turn them on in Me › Settings.</p>';
    return html;
  };
  const kindName = (p) => (p.kind === 'rest' ? 'rest' : p.kind === 'hidden' ? 'hidden energy' : COST_LABEL[p.cost] || '');
  function planCard(p) {
    const cls = p.kind === 'rest' ? 'm' : p.kind === 'hidden' ? '' : 'y';
    return `<button class="c ${cls}" data-act="planEdit" data-id="${p.id}"><div class="row"><b>${esc(p.title)}</b><span class="sp"></span><span class="tiny">${kindName(p)}</span></div>
      <div class="tiny">${LW.fmtDate(p.date)}${p.time ? ' · ' + esc(p.time) : ''}${p.kind === 'social' && p.feel ? ` · ${p.feel === 'love' ? '♡ love it' : 'feel obligated'}` : ''}</div></button>`;
  }
  A.weekNav = (d) => {
    LW.tmp.weekOffset = (LW.tmp.weekOffset || 0) + Number(d.dir);
    LW.render();
  };
  A.addRest = (d) => {
    plans().push({ id: LW.uid(), title: 'Rest', date: d.date, time: '', kind: 'rest', cost: 'sip', feel: '' });
    LW.toast('Rest added ✦');
    LW.refresh();
  };
  A.dayOpen = (d) =>
    LW.openSheet(() => {
      const ps = plans().filter((p) => p.date === d.date);
      return `<h2>${LW.fmtDate(d.date, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        ${ps.length ? ps.map(planCard).join('') : '<p class="empty">Nothing planned. Lovely.</p>'}
        <button class="btn" data-act="planNew" data-date="${d.date}">+ Add a plan</button>`;
    });

  /* ---------- plan sheet ---------- */
  function planSheet(S) {
    const warnings = LW.checkPlan(S);
    const notes = LW.state.energy.rules.filter((r) => r.on && r.kind === 'note');
    return `<h2>${S.id && LW.byId(plans(), S.id) ? 'Edit plan' : 'New plan'}</h2>
      <div class="field"><label>What</label><input type="text" data-sbind="title" value="${esc(S.title)}" placeholder="Board games at Bestie's" ${S.id && LW.byId(plans(), S.id) ? '' : 'autofocus'}></div>
      <div class="grid2"><div class="field"><label>When</label><input type="date" data-sbind="date" value="${esc(S.date)}" data-rerender></div>
      <div class="field"><label>Time (optional)</label><input type="time" data-sbind="time" value="${esc(S.time)}" data-rerender></div></div>
      <div class="field"><span class="flabel">Kind</span>${LW.chipsSelect(
        [
          ['social', 'Social', 'y'],
          ['rest', 'Rest', 'm'],
          ['hidden', 'Hidden energy (work, class…)', ''],
        ],
        S.kind,
        'planSet',
        'kind'
      )}</div>
      ${
        S.kind === 'social'
          ? `<div class="field"><span class="flabel">Energy cost</span>${LW.chipsSelect(
              Object.keys(COST).map((k) => [k, COST_LABEL[k], 'y']),
              S.cost,
              'planSet',
              'cost'
            )}</div>
      <div class="field"><span class="flabel">How do you feel about it?</span>${LW.chipsSelect(
        [
          ['love', '♡ love it', 'p'],
          ['obligated', 'feel obligated', ''],
        ],
        S.feel,
        'planSet',
        'feel'
      )}</div>`
          : ''
      }
      ${
        warnings.length
          ? `<div class="c o fill-o"><div class="lab">Heads-up from your rules</div>${warnings.map((w) => `<div style="margin-bottom:4px">${w}</div>`).join('')}
        <div class="chips" style="margin-top:6px">${S.cost !== 'sip' ? '<button class="chip m" data-act="planShorter">Make it shorter</button>' : ''}<span class="tiny">or change the day above, or keep it anyway. Your call.</span></div></div>`
          : ''
      }
      ${S.kind === 'social' && notes.length ? `<div class="tiny" style="margin-bottom:6px">Your rules: ${notes.map((r) => esc(r.text)).join(' · ')}</div>` : ''}
      <button class="btn" data-act="planSave">${S.id && LW.byId(plans(), S.id) ? 'Save' : 'Add to week'}</button>
      ${
        S.id && LW.byId(plans(), S.id)
          ? `${S.kind === 'social' ? '<button class="btn g" data-act="planCancelSlip">Cancel it, with my permission slip ♡</button>' : ''}<button class="btn danger" data-act="planDel">Delete</button>`
          : ''
      }`;
  }
  A.planNew = (d) => LW.openSheet(planSheet, { id: LW.uid(), title: '', date: d.date || LW.today(), time: '', kind: 'social', cost: 'gulp', feel: 'love', isNew: true });
  A.planEdit = (d) => {
    const p = LW.byId(plans(), d.id);
    LW.openSheet(planSheet, { ...p, orig: { date: p.date, cost: p.cost } });
  };
  A.planSet = (d) => {
    for (const k of ['kind', 'cost', 'feel']) if (d[k] !== undefined) LW.S[k] = d[k];
    LW.renderSheet();
  };
  A.planShorter = () => {
    LW.S.cost = LW.S.cost === 'drain' ? 'gulp' : 'sip';
    LW.S.shortened = true;
    LW.renderSheet();
  };
  A.planSave = () => {
    const S = LW.S;
    if (!S.title.trim()) S.title = S.kind === 'rest' ? 'Rest' : S.kind === 'hidden' ? LW.state.energy.hidden.label || 'Hidden energy' : 'Plan';
    if (!S.date) return LW.toast('Pick a day first');
    const p = { id: S.id, title: S.title.trim(), date: S.date, time: S.time || '', kind: S.kind, cost: S.cost, feel: S.kind === 'social' ? S.feel : '' };
    const ex = LW.byId(plans(), S.id);
    if (ex) {
      if (S.orig && (S.orig.date !== p.date || COST[p.cost] < COST[S.orig.cost])) LW.sparkle('said_no');
      Object.assign(ex, p);
    } else plans().push(p);
    if (S.shortened) LW.sparkle('said_no');
    LW.closeSheet();
    LW.refresh();
  };
  A.planDel = () => {
    LW.remove(plans(), LW.S.id);
    LW.closeSheet();
    LW.refresh();
  };
  A.planCancelSlip = () => {
    LW.remove(plans(), LW.S.id);
    LW.sparkle('said_no');
    LW.closeSheet();
    LW.save();
    location.hash = '#/slip';
  };

  /* ---------- rules ---------- */
  LW.views.energyRules = function () {
    const E = LW.state.energy;
    return `${LW.back('#/energy', 'Energy')}<h1>My energy rules</h1><p class="sub">Edit them to fit you. The app gives a gentle heads-up, never a block.</p>
      <div class="field"><label>My weekly social battery (☕ sip = 1, 🥤 gulp = 2, 🪫 drain = 3)</label><input type="number" min="1" max="50" value="${esc(E.capacity)}" data-bind="energy.capacity"></div>
      ${E.rules
        .map(
          (r) => `<div class="c y"><div class="row"><input type="checkbox" data-bind="energy.rules.#${r.id}.on" ${r.on ? 'checked' : ''} aria-label="Rule on">
          <input type="text" class="inline-in" value="${esc(r.text)}" data-bind="energy.rules.#${r.id}.text" aria-label="Rule wording">
          ${r.kind === 'note' ? `<button class="icon-btn" data-act="ruleDel" data-id="${r.id}" aria-label="Delete rule">✕</button>` : ''}</div>
          ${r.kind === 'maxWeek' ? `<div class="row tiny" style="margin-top:4px">Limit <input type="number" min="1" max="21" value="${esc(r.n)}" data-bind="energy.rules.#${r.id}.n" style="width:80px"></div>` : ''}
          ${r.kind !== 'note' ? '<div class="tiny">The app checks this one for you.</div>' : ''}</div>`
        )
        .join('')}
      <div class="c"><div class="row"><input type="text" id="rule-new" placeholder="Add my own rule…" data-enter="ruleAdd"><button class="icon-btn" data-act="ruleAdd" aria-label="Add rule">＋</button></div><div class="tiny">Your own rules show as reminders whenever you add a plan.</div></div>
      <h2>Hidden energy</h2><p class="sub">Things that use energy but don't feel social, like work or class. Shown striped on your week.</p>
      <div class="field"><label>Call it</label><input type="text" value="${esc(E.hidden.label)}" data-bind="energy.hidden.label"></div>
      <div class="chips">${LW.DAYS.map((d, i) => `<button class="chip ${E.hidden.days.includes(i) ? 'sel' : 'w'}" data-act="hiddenDay" data-i="${i}">${d}</button>`).join('')}</div>`;
  };
  A.ruleDel = (d) => {
    LW.remove(LW.state.energy.rules, d.id);
    LW.refresh();
  };
  A.ruleAdd = () => {
    const v = (document.getElementById('rule-new').value || '').trim();
    if (!v) return;
    LW.state.energy.rules.push({ id: LW.uid(), kind: 'note', text: v, on: true });
    LW.sparkle('personal');
    LW.refresh();
  };
  A.hiddenDay = (d) => {
    const days = LW.state.energy.hidden.days;
    const i = Number(d.i);
    LW.state.energy.hidden.days = days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort();
    LW.refresh();
  };

  /* ---------- people ---------- */
  const TAGS = [
    ['fills', 'fills me up', 'm'],
    ['neutral', 'neutral', ''],
    ['costs', 'costs a lot', 'o'],
  ];
  const tagInfo = (t) => TAGS.find((x) => x[0] === t) || TAGS[1];
  LW.lastSeen = (p) => {
    const l = p.logs.length ? p.logs[p.logs.length - 1].date : '';
    return [l, p.lastSeen || ''].sort().pop();
  };
  LW.peopleDue = () =>
    LW.state.people.list
      .filter((p) => p.closer && Number(p.every) > 0)
      .filter((p) => {
        const l = LW.lastSeen(p) || p.added;
        return !!l && LW.daysBetween(l, LW.today()) >= Number(p.every);
      })
      .filter((p) => !p.snooze || p.snooze <= LW.today());
  const nextDate = (md) => {
    // md = "MM-DD"
    if (!md) return null;
    const y = new Date().getFullYear();
    let k = `${y}-${md}`;
    if (k < LW.today()) k = `${y + 1}-${md}`;
    return k;
  };
  LW.upcomingDates = (days = 30) => {
    const out = [];
    for (const p of LW.state.people.list)
      for (const d of p.dates || []) {
        const k = nextDate(d.md);
        if (k && LW.daysBetween(LW.today(), k) <= days) out.push({ p, d, k, n: LW.daysBetween(LW.today(), k) });
      }
    return out.sort((a, b) => a.n - b.n);
  };

  LW.views.people = function () {
    const list = LW.state.people.list;
    const due = LW.peopleDue();
    const up = LW.upcomingDates(45);
    return `${LW.back('#/energy', 'Energy')}<h1>My people</h1><p class="sub">🔒 Private · only you see this, and it never leaves your phone</p>
      ${due
        .map(
          (p) => `<div class="c p"><div class="lab">Gentle nudge</div>It's been a while since you saw ${esc(p.name)}${p.method ? ` (${esc(p.method)})` : ''}.
        <div class="chips" style="margin-top:6px"><button class="chip p" data-act="personSeen" data-id="${p.id}">We caught up ✦</button><button class="chip" data-act="personSnooze" data-id="${p.id}">Remind me in 3 days</button></div></div>`
        )
        .join('')}
      ${up.length ? `<div class="c y"><div class="lab">Coming up</div>${up.map((u) => `<div class="row tiny"><span>${esc(u.d.label)} · ${esc(u.p.name)}</span><span class="sp"></span><span>${u.n === 0 ? 'today!' : LW.plural(u.n, 'day')}</span></div>`).join('')}</div>` : ''}
      ${
        list.length
          ? list
              .map((p) => {
                const t = tagInfo(p.tag);
                return `<a class="c ${t[2]}" href="#/person/${p.id}"><div class="row"><b>${esc(p.name)}</b><span class="sp"></span>${p.closer ? '<span class="chip p static">want closer</span>' : ''}<span class="chip ${t[2]} static">${t[1]}</span></div>
            <div class="tiny">${p.activity ? esc(p.activity) + ' · ' : ''}last seen ${esc(LW.ago(LW.lastSeen(p)))}${summary(p)}</div></a>`;
              })
              .join('')
          : '<p class="empty">Add the people you want to keep track of: friends, family, groups, even activities that fill you up.</p>'
      }
      <button class="btn g" data-act="personNew">+ Add someone</button>
      <div class="note">People can be perfectly nice and still not right for you. "Costs a lot" is a kind way of noticing that.</div>`;
  };
  function summary(p) {
    const last = p.logs.slice(-5);
    if (last.length < 3) return '';
    const low = last.filter((l) => l.feel <= 2).length;
    const high = last.filter((l) => l.feel >= 4).length;
    if (low >= 3) return ` · felt drained after ${low} of last ${last.length}`;
    if (high >= 3) return ` · felt lifted after ${high} of last ${last.length}`;
    return '';
  }
  A.personSeen = (d) => {
    LW.byId(LW.state.people.list, d.id).lastSeen = LW.today();
    LW.sparkle('connected');
    LW.refresh();
  };
  A.personSnooze = (d) => {
    LW.byId(LW.state.people.list, d.id).snooze = LW.addDays(LW.today(), 3);
    LW.refresh();
  };

  function personSheet(S) {
    return `<h2>${S.isNew ? 'Add someone' : 'Edit'}</h2>
      <div class="field"><label>Name or nickname</label><input type="text" data-sbind="name" value="${esc(S.name)}" ${S.isNew ? 'autofocus' : ''} placeholder="Bestie, Coffee pal, Group chat…"></div>
      <div class="field"><label>What you do together</label><input type="text" data-sbind="activity" value="${esc(S.activity)}" placeholder="Gaming, coffee, co-working…"></div>
      <div class="field"><span class="flabel">How do they feel to be around?</span>${LW.chipsSelect(TAGS, S.tag, 'personSet', 'tag')}</div>
      <label class="switch"><span>I want to be closer to them</span><input type="checkbox" data-sbind="closer" ${S.closer ? 'checked' : ''} data-rerender></label>
      ${
        S.closer
          ? `<div class="grid2"><div class="field"><label>Nudge me after (days)</label><input type="number" min="1" data-sbind="every" value="${esc(S.every)}"></div>
      <div class="field"><label>How to check in</label><input type="text" data-sbind="method" value="${esc(S.method)}" placeholder="voice note, coffee…"></div></div>`
          : ''
      }
      <div class="field"><span class="flabel">Do their values fit mine? (optional)</span><textarea data-sbind="values" style="min-height:60px" placeholder="Just for you.">${esc(S.values)}</textarea></div>
      <div class="flabel">Important dates</div>
      ${S.dates
        .map(
          (d, i) => `<div class="edit-row"><input type="text" value="${esc(d.label)}" data-act-input data-i="${i}" data-field="label" class="pdate" placeholder="🎂 Birthday">
        <input type="date" value="${d.md ? `2000-${d.md}` : ''}" class="pdate" data-i="${i}" data-field="md" style="width:auto"><button class="icon-btn" data-act="pdateDel" data-i="${i}" aria-label="Remove date">✕</button></div>`
        )
        .join('')}
      <button class="btn sm g" data-act="pdateAdd">+ Add a date</button>
      <button class="btn" data-act="personSave">Save</button>
      ${S.isNew ? '' : '<button class="btn danger" data-act="personDel">Delete</button>'}`;
  }
  // date rows inside the person sheet
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.classList || !el.classList.contains('pdate') || !LW.S.dates) return;
    const row = LW.S.dates[Number(el.dataset.i)];
    if (!row) return;
    row[el.dataset.field] = el.dataset.field === 'md' ? (el.value ? el.value.slice(5) : '') : el.value;
  });
  A.pdateAdd = () => {
    syncDates();
    LW.S.dates.push({ label: '', md: '' });
    LW.renderSheet();
  };
  A.pdateDel = (d) => {
    syncDates();
    LW.S.dates.splice(Number(d.i), 1);
    LW.renderSheet();
  };
  function syncDates() {
    document.querySelectorAll('#sheet .pdate').forEach((el) => {
      const row = LW.S.dates[Number(el.dataset.i)];
      if (row) row[el.dataset.field] = el.dataset.field === 'md' ? (el.value ? el.value.slice(5) : '') : el.value;
    });
  }
  A.personSet = (d) => {
    LW.S.tag = d.tag;
    LW.renderSheet();
  };
  A.personNew = () =>
    LW.openSheet(personSheet, { isNew: true, id: LW.uid(), name: '', activity: '', tag: 'neutral', closer: false, every: 21, method: '', values: '', dates: [], logs: [], lastSeen: '', added: LW.today() });
  A.personEdit = (d) => {
    const p = LW.byId(LW.state.people.list, d.id);
    LW.openSheet(personSheet, JSON.parse(JSON.stringify(p)));
  };
  A.personSave = () => {
    syncDates();
    const S = LW.S;
    if (!S.name.trim()) return LW.toast('Give them a name first');
    const p = {
      id: S.id,
      name: S.name.trim(),
      activity: S.activity || '',
      tag: S.tag,
      closer: !!S.closer,
      every: Number(S.every) || 21,
      method: S.method || '',
      values: S.values || '',
      dates: S.dates.filter((d) => d.label || d.md),
      logs: S.logs || [],
      lastSeen: S.lastSeen || '',
      snooze: S.snooze || '',
      added: S.added || LW.today(),
    };
    const ex = LW.byId(LW.state.people.list, p.id);
    if (ex) Object.assign(ex, p);
    else LW.state.people.list.push(p);
    LW.closeSheet();
    LW.refresh();
  };
  A.personDel = () => {
    if (!confirm('Remove this person and their notes?')) return;
    LW.remove(LW.state.people.list, LW.S.id);
    LW.closeSheet();
    LW.save();
    location.hash = '#/people';
  };

  const FACES = ['😮‍💨', '😐', '😊', '🥰', '✨'];
  LW.views.person = function (id) {
    const p = LW.byId(LW.state.people.list, id);
    if (!p) return `${LW.back('#/people')}<p class="empty">Not found.</p>`;
    const t = tagInfo(p.tag);
    const logs = p.logs.slice().reverse();
    const avg = p.logs.length ? p.logs.reduce((n, l) => n + l.feel, 0) / p.logs.length : 0;
    return `${LW.back('#/people', 'My people')}
      <div class="hdr"><h1>${esc(p.name)}</h1><button class="icon-btn" data-act="personEdit" data-id="${p.id}" aria-label="Edit">✎</button></div>
      <div class="chips" style="margin-bottom:10px"><span class="chip ${t[2]} static">${t[1]}</span>${p.closer ? '<span class="chip p static">want closer</span>' : ''}${p.activity ? `<span class="chip static">${esc(p.activity)}</span>` : ''}</div>
      <div class="tiny">Last seen ${esc(LW.ago(LW.lastSeen(p)))}${p.closer ? ` · nudge after ${p.every} days${p.method ? ' · ' + esc(p.method) : ''}` : ''}</div>
      <button class="btn" data-act="feelNew" data-id="${p.id}">How do I feel after seeing them?</button>
      ${p.logs.length >= 2 ? `<div class="c s" style="margin-top:12px"><div class="lab">Over time</div>On average you feel ${FACES[Math.round(avg) - 1] || ''} after time with ${esc(p.name)}.${summary(p) ? '<br>' + summary(p).slice(3) + '.' : ''}</div>` : ''}
      ${p.values ? `<div class="c"><div class="lab">Values</div>${esc(p.values)}</div>` : ''}
      ${p.dates.length ? `<div class="c y"><div class="lab">Dates</div>${p.dates.map((d) => `<div class="row tiny"><span>${esc(d.label)}</span><span class="sp"></span><span>${d.md ? LW.fmtDate('2000-' + d.md, { day: 'numeric', month: 'long' }) : ''}</span></div>`).join('')}</div>` : ''}
      ${logs.length ? '<h2>Feeling log</h2>' + logs.map((l) => `<div class="c"><div class="row"><span style="font-size:1.3rem">${FACES[l.feel - 1]}</span><span class="tiny">${LW.fmtDate(l.date)}${l.what ? ' · ' + esc(l.what) : ''}</span><span class="sp"></span><span class="tiny">${l.smile ? 'smiling: ' + esc(l.smile) : ''}</span></div></div>`).join('') : ''}`;
  };
  function feelSheet(S) {
    const p = LW.byId(LW.state.people.list, S.pid);
    return `<h2>How do you feel?</h2><p class="sub">After time with ${esc(p.name)}</p>
      <div class="field"><input type="text" data-sbind="what" value="${esc(S.what)}" placeholder="What did you do? (optional)"></div>
      <div class="row" style="justify-content:space-between;font-size:1.8rem;margin:8px 0">${FACES.map((f, i) => `<button class="icon-btn" style="font-size:1.8rem;${S.feel === i + 1 ? 'outline:2px solid var(--accent);border-radius:50%' : ''}" data-act="feelSet" data-k="feel" data-v="${i + 1}" aria-label="${['drained', 'meh', 'good', 'lovely', 'sparkly'][i]}">${f}</button>`).join('')}</div>
      <div class="row tiny"><span>drained</span><span class="sp"></span><span>sparkly</span></div>
      <div class="lab" style="margin-top:12px">Was I smiling?</div>
      ${LW.chipsSelect([['lots', 'lots', 'm'], ['a bit', 'a bit', ''], ['not really', 'not really', '']], S.smile, 'feelSet', 'v', '').replace(/data-act="feelSet"/g, 'data-act="feelSet" data-k="smile"')}
      <div class="lab" style="margin-top:12px">Did they give back as much as they took?</div>
      ${LW.chipsSelect([['yes', 'yes', 'm'], ['about even', 'about even', ''], ['no', 'no', '']], S.give, 'feelSet', 'v', '').replace(/data-act="feelSet"/g, 'data-act="feelSet" data-k="give"')}
      <button class="btn" data-act="feelSave" ${S.feel ? '' : 'disabled'}>Save · 10 seconds ✦</button>`;
  }
  A.feelNew = (d) => LW.openSheet(feelSheet, { pid: d.id, feel: 0, smile: '', give: '', what: '' });
  A.feelSet = (d) => {
    LW.S[d.k] = d.k === 'feel' ? Number(d.v) : d.v;
    LW.renderSheet();
  };
  A.feelSave = () => {
    const S = LW.S;
    const p = LW.byId(LW.state.people.list, S.pid);
    p.logs.push({ date: LW.today(), feel: S.feel, smile: S.smile, give: S.give, what: (S.what || '').trim() });
    p.snooze = '';
    LW.sparkle('connected');
    LW.closeSheet();
    LW.refresh();
  };
})();
