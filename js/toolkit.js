/* Lost Wings – Toolkit hub, Chaos Audit, Chaos Bunny log, capsule wardrobe */
(function () {
  'use strict';
  const { esc } = LW;
  const A = LW.actions;

  /* ---------- hub ---------- */
  LW.views.toolkit = function () {
    const items = [
      ['audit', '🗺️', 'Chaos Audit', 'Where does life feel tangled right now?', '#/audit', 's'],
      ['chaos', '🐰', 'Chaos Bunny log', 'Incident reports and gentle patterns', '#/chaos', 'p'],
      ['wardrobe', '👗', 'Capsule wardrobe', 'Three styles, outfits on hangers', '#/wardrobe', 'm'],
      ['wing', '♡', 'Permission slip', 'Rest without explaining', '#/slip', 'p'],
      ['wing', '🪽', 'My wings over time', 'Month view and gentle patterns', '#/wing/history', 'y'],
      ['shame', '🫙', 'Shame journey', 'Slow, self-paced, with a pause button', '#/shame', 'o'],
      ['shame', '✨', 'Compliments jar', "Evidence for what's actually true", '#/jar', 'y'],
    ].filter(([t]) => LW.on(t));
    return `<h1>Toolkit</h1><p class="sub">Take what helps and leave the rest.</p>
      ${items.map(([, ic, name, desc, href, c]) => `<a class="c ${c}" href="${href}"><div class="row"><span style="font-size:1.5rem;width:34px">${ic}</span><div><b>${name}</b><div class="tiny">${desc}</div></div></div></a>`).join('')}
      <p class="tiny center">Want more or fewer tools? <a href="#/settings">Choose your toolkit</a>.</p>`;
  };

  /* ---------- Chaos Audit ---------- */
  const LEVELS = [
    ['0', 'feels fine', 'm'],
    ['1', 'a bit wobbly', 'y'],
    ['2', 'tangled', 'p'],
  ];
  LW.views.audit = function () {
    const Au = LW.state.audit;
    if (LW.tmp.auditEdit)
      return `${LW.back('#/toolkit', 'Toolkit')}<h1>Edit your life areas</h1><p class="sub">Rename, add or remove areas, and choose which tool each one points to.</p>
        ${Au.areas
          .map(
            (a) => `<div class="c"><div class="row"><input type="text" class="inline-in" value="${esc(a.name)}" data-bind="audit.areas.#${a.id}.name"><button class="icon-btn" data-act="auditDel" data-id="${a.id}" aria-label="Remove">✕</button></div>
          <select data-bind="audit.areas.#${a.id}.tool" aria-label="Linked tool"><option value="">No tool</option>${Object.entries(LW.TOOLS)
            .map(([k, t]) => `<option value="${k}" ${a.tool === k ? 'selected' : ''}>${esc(t.name)}</option>`)
            .join('')}</select></div>`
          )
          .join('')}
        <div class="c"><div class="row"><input type="text" id="area-new" placeholder="Add an area…" data-enter="auditAdd"><button class="icon-btn" data-act="auditAdd">＋</button></div></div>
        <button class="btn" data-act="auditEdit">Done</button>`;
    const tangled = Au.areas.filter((a) => a.state === 2);
    const wobbly = Au.areas.filter((a) => a.state === 1);
    const touched = Au.areas.some((a) => a.state > 0);
    return `${LW.back('#/toolkit', 'Toolkit')}
      <div class="hdr"><h1>Chaos Audit</h1><button class="icon-btn" data-act="auditEdit" aria-label="Edit areas">✎</button></div>
      <p class="sub">Go through each area and notice how it feels right now. No scores, no diagnosis. Just a starting-point map.</p>
      ${Au.areas.map((a) => `<div class="c"><b>${esc(a.name)}</b><div style="margin-top:6px">${LW.chipsSelect(LEVELS, String(a.state), 'auditSet', 'v').replace(/data-act="auditSet"/g, `data-act="auditSet" data-id="${a.id}"`)}</div></div>`).join('')}
      ${
        touched
          ? `<h2>Your map</h2>
        ${tangled.length ? `<div class="c p fill-p"><div class="lab">Most tangled</div>${tangled.map(areaLine).join('')}</div>` : ''}
        ${wobbly.length ? `<div class="c y fill-y"><div class="lab">A bit wobbly</div>${wobbly.map(areaLine).join('')}</div>` : ''}
        <div class="note">Pick just one tangled area to start with. Everything else can wait.</div>
        <button class="btn" data-act="auditDone">Save my map</button>
        <button class="btn g" data-act="auditClear">Start again</button>`
          : ''
      }
      ${Au.doneOn ? `<p class="tiny center">Last mapped ${LW.fmtDate(Au.doneOn, { day: 'numeric', month: 'long' })}</p>` : ''}`;
  };
  function areaLine(a) {
    const t = LW.TOOLS[a.tool];
    return `<div class="row" style="padding:3px 0"><span>${esc(a.name)}</span><span class="sp"></span>${t ? `<a class="chip w" href="${t.href}">${t.icon} ${esc(t.name.replace(' (heavier)', ''))}</a>` : ''}</div>`;
  }
  A.auditSet = (d) => {
    const a = LW.byId(LW.state.audit.areas, d.id);
    a.state = Number(d.v);
    LW.refresh();
  };
  A.auditEdit = () => {
    LW.tmp.auditEdit = !LW.tmp.auditEdit;
    LW.render();
  };
  A.auditDel = (d) => {
    LW.remove(LW.state.audit.areas, d.id);
    LW.refresh();
  };
  A.auditAdd = () => {
    const v = (document.getElementById('area-new').value || '').trim();
    if (!v) return;
    LW.state.audit.areas.push({ id: LW.uid(), name: v, tool: '', state: 0 });
    LW.sparkle('personal');
    LW.refresh();
  };
  A.auditDone = () => {
    LW.state.audit.doneOn = LW.today();
    LW.sparkle('audit');
    LW.toast('Map saved ✦');
    LW.refresh();
  };
  A.auditClear = () => {
    LW.state.audit.areas.forEach((a) => (a.state = 0));
    LW.refresh();
  };

  /* ---------- Chaos Bunny ---------- */
  const PARTS = [
    ['ears', 'Ears', 'overwhelm, noise'],
    ['head', 'Head', 'brain fog, forgetting'],
    ['heart', 'Heart', 'feelings'],
    ['paws', 'Paws', 'getting things done'],
    ['feet', 'Feet', 'getting out the door'],
  ];
  const FORGIVE = [
    ['yes', 'Yes', 'm'],
    ['notyet', 'Not yet', ''],
    ['carrots', 'Offering carrots 🥕', 'y'],
  ];
  function bunnyTap(sel) {
    const s = (p) => (sel.includes(p) ? 'part sel' : 'part');
    const st = 'fill="#fff" stroke="#ee6cb0" stroke-width="6"';
    return `<svg class="bunny bunny-tap" style="width:120px" viewBox="20 0 260 410" role="group" aria-label="Tap where the chaos hit">
      <g class="${s('ears')}" data-act="chaosPart" data-p="ears"><ellipse cx="112" cy="95" rx="27" ry="72" transform="rotate(-10 112 95)" ${st}/><ellipse cx="188" cy="95" rx="27" ry="72" transform="rotate(10 188 95)" ${st}/></g>
      <g class="${s('paws')}" data-act="chaosPart" data-p="paws"><ellipse cx="74" cy="262" rx="20" ry="38" transform="rotate(40 74 262)" ${st}/><ellipse cx="226" cy="262" rx="20" ry="38" transform="rotate(-40 226 262)" ${st}/></g>
      <g class="${s('heart')}" data-act="chaosPart" data-p="heart"><ellipse cx="150" cy="295" rx="74" ry="85" ${st}/><path d="M150 330 l-22 -22 a13 13 0 0 1 22 -16 a13 13 0 0 1 22 16 z" fill="#f9d6e8"/></g>
      <g class="${s('feet')}" data-act="chaosPart" data-p="feet"><ellipse cx="108" cy="380" rx="36" ry="19" ${st}/><ellipse cx="192" cy="380" rx="36" ry="19" ${st}/></g>
      <g class="${s('head')}" data-act="chaosPart" data-p="head"><ellipse cx="150" cy="178" rx="80" ry="64" ${st}/><circle cx="122" cy="174" r="7" fill="#3d4a7a"/><circle cx="178" cy="174" r="7" fill="#3d4a7a"/><ellipse cx="150" cy="190" rx="6" ry="4.5" fill="#ee6cb0"/><path d="M136 210 H164" stroke="#3d4a7a" stroke-width="5" stroke-linecap="round"/></g>
    </svg>`;
  }
  LW.views.chaosNew = function () {
    const C = LW.state.chaos;
    if (!LW.tmp.chaos) LW.tmp.chaos = { types: [], parts: [], level: 5, note: '', other: '' };
    const t = LW.tmp.chaos;
    return `${LW.back('#/today', 'Today')}
      <div class="c s fill-s center" style="margin-top:4px"><b style="color:var(--blue)">Chaos Bunny Incident Report</b><div class="tiny">${LW.c('Department of Hopping Out of Burnout', 'Department of What The Actual Fluff')}</div></div>
      <div class="hdr"><div class="lab" style="flex:1;margin:10px 0 4px">What happened?</div><button class="icon-btn" data-act="chaosTypesEdit" aria-label="Edit incident types">✎</button></div>
      <div class="c">${C.types.map((ty) => LW.tick(t.types.includes(ty.id), esc(ty.text), 'chaosType', `data-id="${ty.id}"`, 'nostrike')).join('')}
        <input type="text" id="chaos-other" placeholder="Something else…" value="${esc(t.other)}" style="margin-top:6px"></div>
      <div class="row"><div><div class="lab">Where did it hit?</div><div class="tiny">Tap the bunny</div>
        <div class="tiny" style="margin-top:6px">${PARTS.filter((p) => t.parts.includes(p[0])).map((p) => `<b>${p[1]}</b>: ${p[2]}`).join('<br>') || '—'}</div></div><span class="sp"></span>${bunnyTap(t.parts)}</div>
      <div class="lab" style="margin-top:8px">Chaos level: <span id="lvl">${t.level}</span></div>
      <input type="range" min="1" max="10" value="${t.level}" id="chaos-level" aria-label="Chaos level">
      <div class="row tiny"><span>mild fluff</span><span class="sp"></span><span>${LW.c('full bunny meltdown', 'full-on f*ckery')}</span></div>
      <div class="field" style="margin-top:10px"><input type="text" id="chaos-note" placeholder="Anything else? (optional)" value="${esc(t.note)}"></div>
      <button class="btn" data-act="chaosFile">File report</button>`;
  };
  function keepChaosInputs() {
    const t = LW.tmp.chaos;
    const g = (id) => document.getElementById(id);
    if (g('chaos-other')) t.other = g('chaos-other').value;
    if (g('chaos-note')) t.note = g('chaos-note').value;
    if (g('chaos-level')) t.level = Number(g('chaos-level').value);
  }
  document.addEventListener('input', (e) => {
    if (e.target.id === 'chaos-level') document.getElementById('lvl').textContent = e.target.value;
  });
  A.chaosType = (d) => {
    keepChaosInputs();
    const t = LW.tmp.chaos;
    t.types = t.types.includes(d.id) ? t.types.filter((x) => x !== d.id) : [...t.types, d.id];
    LW.render();
  };
  A.chaosPart = (d) => {
    keepChaosInputs();
    const t = LW.tmp.chaos;
    t.parts = t.parts.includes(d.p) ? t.parts.filter((x) => x !== d.p) : [...t.parts, d.p];
    LW.render();
  };
  A.chaosFile = () => {
    keepChaosInputs();
    const t = LW.tmp.chaos;
    const C = LW.state.chaos;
    const types = [...t.types];
    if (t.other.trim()) {
      let ty = C.types.find((x) => x.text.toLowerCase() === t.other.trim().toLowerCase());
      if (!ty) C.types.push((ty = { id: LW.uid(), text: t.other.trim(), help: '' }));
      types.push(ty.id);
    }
    const r = { id: LW.uid(), date: LW.today(), hour: new Date().getHours(), types, parts: [...t.parts], level: t.level, note: t.note.trim(), forgive: '' };
    C.reports.push(r);
    LW.tmp.chaos = null;
    LW.tmp.lastReport = r.id;
    LW.sparkle('rumbled');
    LW.save();
    location.hash = '#/chaos/filed';
  };
  A.chaosTypesEdit = () => {
    keepChaosInputs();
    LW.openSheet(() => {
      const C = LW.state.chaos;
      return `<h2>Your kinds of chaos</h2><p class="sub">Rename them, add your own, and write what might help for each one.</p>
      ${C.types
        .map(
          (ty) => `<div class="c"><div class="row"><input type="text" class="inline-in" value="${esc(ty.text)}" data-bind="chaos.types.#${ty.id}.text"><button class="icon-btn" data-act="chaosTypeDel" data-id="${ty.id}" aria-label="Remove">✕</button></div>
        <textarea data-bind="chaos.types.#${ty.id}.help" style="min-height:54px;margin-top:4px" placeholder="What might help next time?">${esc(ty.help)}</textarea></div>`
        )
        .join('')}
      <div class="c"><div class="row"><input type="text" id="ctype-new" placeholder="New kind of chaos…" data-enter="chaosTypeAdd"><button class="icon-btn" data-act="chaosTypeAdd">＋</button></div></div>
      <button class="btn" data-act="sheetDone">Done</button>`;
    });
  };
  A.chaosTypeDel = (d) => {
    LW.remove(LW.state.chaos.types, d.id);
    if (LW.tmp.chaos) LW.tmp.chaos.types = LW.tmp.chaos.types.filter((x) => x !== d.id);
    LW.refresh();
  };
  A.chaosTypeAdd = () => {
    const v = (document.getElementById('ctype-new').value || '').trim();
    if (!v) return;
    LW.state.chaos.types.push({ id: LW.uid(), text: v, help: '' });
    LW.sparkle('personal');
    LW.refresh();
    document.getElementById('ctype-new').focus();
  };

  LW.views.chaosFiled = function () {
    const C = LW.state.chaos;
    const r = LW.byId(C.reports, LW.tmp.lastReport) || C.reports[C.reports.length - 1];
    if (!r) return `${LW.back('#/today')}<p class="empty">No report yet.</p>`;
    const helps = r.types.map((id) => LW.byId(C.types, id)).filter((t) => t && t.help);
    return `<div class="center" style="margin-top:14px">${LW.bunny(110, true)}</div>
      <h1 class="center">Report filed.</h1><p class="sub center">${LW.c('The Chaos Bunny looks suitably rumbled.', 'The Chaos Bunny has been well and truly told off.')}</p>
      <div class="c p"><b>Forgive the Chaos Bunny?</b><div style="margin-top:6px">${LW.chipsSelect(FORGIVE, r.forgive, 'chaosForgive')}</div></div>
      ${helps.length ? `<div class="c s"><div class="lab">Which structure might help?</div>${helps.map((t) => `<div style="margin-bottom:6px"><b>${esc(t.text)}</b> → ${esc(t.help)}</div>`).join('')}</div>` : ''}
      <button class="btn g" data-act="chaosShare">Share my report</button>
      <a class="btn g" href="#/chaos">See my chaos patterns</a>
      <a class="btn" href="#/today">Back to Today</a>`;
  };
  A.chaosForgive = (d) => {
    const C = LW.state.chaos;
    const r = LW.byId(C.reports, LW.tmp.lastReport) || C.reports[C.reports.length - 1];
    r.forgive = d.v;
    if (d.v !== 'notyet') LW.sparkle('forgave');
    LW.refresh();
  };
  A.chaosShare = async () => {
    const C = LW.state.chaos;
    const r = LW.byId(C.reports, LW.tmp.lastReport) || C.reports[C.reports.length - 1];
    const what = r.types.map((id) => (LW.byId(C.types, id) || {}).text).filter(Boolean);
    const text = `🐰 Chaos Bunny Incident Report\n${what.map((w) => '☑ ' + w).join('\n')}\nChaos level: ${r.level}/10\nForgiven: ${(FORGIVE.find((f) => f[0] === r.forgive) || ['', 'pending'])[1]}\n\n#LostWings`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        LW.toast('Copied, ready to paste ✦');
      }
    } catch (e) {
      /* user cancelled */
    }
  };

  LW.views.chaos = function () {
    const C = LW.state.chaos;
    const since = LW.addDays(LW.today(), -28);
    const recent = C.reports.filter((r) => r.date >= since);
    let html = `${LW.back('#/toolkit', 'Toolkit')}<div class="hdr"><h1>Chaos patterns</h1><button class="icon-btn" data-act="chaosTypesEdit" aria-label="Edit incident types">✎</button></div>
      <p class="sub">Last 4 weeks · ${LW.plural(recent.length, 'report')}</p>
      <a class="btn" href="#/chaos/new">${LW.c('Chaos happened 🐰', 'Well, sh*t happened 🐰')}</a>`;
    if (recent.length < 2) return html + `<p class="empty">File a few reports and gentle patterns will start to show here.</p>` + history(C);
    const days = Array(7).fill(0);
    recent.forEach((r) => days[LW.weekday(r.date)]++);
    const max = Math.max(...days);
    const peak = days.indexOf(max);
    html += `<div class="c y"><div class="lab">Your chaos peaks on</div><div class="hbar">${days.map((n) => `<i class="${n === max ? 'top' : ''}" style="height:${max ? (n / max) * 100 : 0}%"></i>`).join('')}</div>
      <div class="hbar-l">${LW.DAYS.map((d) => `<span>${d[0]}</span>`).join('')}</div><div class="tiny" style="margin-top:4px">${LW.DAYS_LONG[peak]}s.${peak === 0 ? ' Of course it\'s Mondays.' : ''}</div></div>`;
    const count = {};
    recent.forEach((r) => r.types.forEach((t) => (count[t] = (count[t] || 0) + 1)));
    const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      const ty = LW.byId(C.types, top[0]);
      if (ty) html += `<div class="c s"><div class="lab">Most common</div>${esc(ty.text)} (${LW.plural(top[1], 'time')})${ty.help ? `<div class="tiny">Try: ${esc(ty.help)}</div>` : ''}</div>`;
    }
    const pc = {};
    recent.forEach((r) => r.parts.forEach((p) => (pc[p] = (pc[p] || 0) + 1)));
    const tp = Object.entries(pc).sort((a, b) => b[1] - a[1])[0];
    if (tp) {
      const part = PARTS.find((p) => p[0] === tp[0]);
      html += `<div class="c p"><div class="lab">Where it usually hits</div>${part[1]} (${part[2]})</div>`;
    }
    const prev = C.reports.filter((r) => r.date < since && r.date >= LW.addDays(since, -28));
    const avg = (a) => a.reduce((n, r) => n + r.level, 0) / a.length;
    if (prev.length >= 2) {
      const a1 = avg(prev).toFixed(0),
        a2 = avg(recent).toFixed(0);
      if (Number(a2) < Number(a1)) html += `<div class="c m"><div class="lab">Good news</div>Chaos level is down from ${a1} to ${a2} on average. ✦</div>`;
      else html += `<div class="c"><div class="lab">Chaos level</div>Averaging ${a2} out of 10. Be gentle with yourself.</div>`;
    }
    return html + history(C);
  };
  function history(C) {
    const last = C.reports.slice(-10).reverse();
    if (!last.length) return '';
    return (
      '<h2>Recent reports</h2>' +
      last
        .map(
          (r) => `<div class="c"><div class="row"><span class="tiny">${LW.fmtDate(r.date)}</span><span class="sp"></span><span class="chip p static">level ${r.level}</span><button class="icon-btn" data-act="chaosDel" data-id="${r.id}" aria-label="Delete report">✕</button></div>
        <div>${r.types.map((id) => esc((LW.byId(C.types, id) || {}).text || '')).filter(Boolean).join(' · ') || '<span class="tiny">unspecified chaos</span>'}</div>${r.note ? `<div class="tiny">${esc(r.note)}</div>` : ''}</div>`
        )
        .join('')
    );
  }
  A.chaosDel = (d) => {
    if (!confirm('Delete this report?')) return;
    LW.remove(LW.state.chaos.reports, d.id);
    LW.refresh();
  };

  /* ---------- Capsule wardrobe ---------- */
  LW.views.wardrobe = function () {
    const W = LW.state.wardrobe;
    const clean = W.outfits.filter((o) => o.clean);
    const tm = LW.byId(W.outfits, W.tomorrow);
    const styleName = (id) => (LW.byId(W.styles, id) || {}).name || '';
    return `${LW.back('#/toolkit', 'Toolkit')}<h1>Capsule wardrobe</h1><p class="sub">Easy, comfy, replicable</p>
      <div class="c p fill-p center"><div class="lab">Tomorrow's outfit</div>
        ${tm ? `<div style="font-size:2.4rem">${esc(tm.emoji)}</div><b>${esc(tm.name)}</b>${tm.notes ? `<div class="tiny">${esc(tm.notes)}</div>` : ''}` : '<div class="tiny">Not picked yet</div>'}
        <div class="row" style="justify-content:center;flex-wrap:wrap">${tm ? `<button class="btn sm" data-act="outfitWear" data-id="${tm.id}">Wore it ✓</button>` : ''}<button class="btn sm g" data-act="outfitRandom">Too tired, pick for me</button></div></div>

      <h2>Outfits on hangers</h2>
      <p class="sub">${clean.length} of ${W.outfits.length} ready before laundry</p>
      <div class="bar" style="height:10px;margin-bottom:10px"><b style="width:${W.outfits.length ? (clean.length / W.outfits.length) * 100 : 0}%;background:var(--mintM)"></b></div>
      ${clean.length <= 3 && W.outfits.length ? `<div class="c y"><div class="lab">Heads-up</div>About ${LW.plural(clean.length, 'day')} until laundry day.</div>` : ''}
      <div class="grid3">${W.outfits
        .map((o) => {
          const p = LW.PAL[o.color] || LW.PAL.lavender;
          return `<button class="c ${p[2]}" style="text-align:center;${o.clean ? '' : 'opacity:.45'};${o.id === W.tomorrow ? 'outline:2px solid var(--accent)' : ''}" data-act="outfitOpen" data-id="${o.id}"><div style="font-size:1.6rem">${esc(o.emoji)}</div><div class="tiny">${esc(o.name)}</div>${o.clean ? '' : '<div class="tiny">in the wash</div>'}</button>`;
        })
        .join('')}</div>
      <button class="btn g" data-act="outfitNew">+ Build an outfit</button>
      ${W.outfits.some((o) => !o.clean) ? '<button class="btn g" data-act="laundryDone">Laundry done 🧺</button>' : ''}

      <div class="hdr"><h2 style="flex:1">My three styles</h2></div>
      ${W.styles
        .map(
          (s, i) => `<div class="c ${['p', 's', 'm', 'y', 'o'][i % 5]}"><div class="row"><span class="tiny">${i + 1}</span><input type="text" class="inline-in" style="font-weight:700" value="${esc(s.name)}" data-bind="wardrobe.styles.#${s.id}.name"><button class="icon-btn" data-act="styleDel" data-id="${s.id}" aria-label="Remove style">✕</button></div>
        <input type="text" class="inline-in tiny" value="${esc(s.desc)}" data-bind="wardrobe.styles.#${s.id}.desc" placeholder="What goes with it?">
        <div class="tiny">${LW.plural(W.outfits.filter((o) => o.style === s.id).length, 'outfit')}</div></div>`
        )
        .join('')}
      ${W.styles.length < 5 ? '<button class="btn sm g" data-act="styleAdd">+ Add a style</button>' : ''}
      <details class="c" style="margin-top:12px"><summary><b>The four questions</b></summary><div class="tiny" style="margin-top:6px">What do I feel most like myself in? What's comfy all day? What can I repeat without thinking? What suits my life (cycling, work, sensory needs)?</div></details>
      <h2>My colours</h2>${LW.stringListEditor('wardrobe.colours', W.colours, 'Add a colour')}
      <h2>Materials that work for me</h2>${LW.stringListEditor('wardrobe.materials', W.materials, 'Add a material')}`;
  };
  function outfitSheet(S) {
    const W = LW.state.wardrobe;
    return `<h2>${S.isNew ? 'Build an outfit' : 'Outfit'}</h2>
      <div class="row"><input type="text" data-sbind="emoji" value="${esc(S.emoji)}" style="width:60px;text-align:center;font-size:1.4rem" aria-label="Emoji">
      <input type="text" data-sbind="name" value="${esc(S.name)}" placeholder="Pinafore · lilac" ${S.isNew ? 'autofocus' : ''}></div>
      <div class="field" style="margin-top:10px"><label>What's on the hanger</label><input type="text" data-sbind="notes" value="${esc(S.notes)}" placeholder="long-sleeved top, leggings, star socks"></div>
      <div class="field"><span class="flabel">Style</span>${LW.chipsSelect(W.styles.map((s) => [s.id, esc(s.name), '']), S.style, 'outfitSet', 'style')}</div>
      <div class="field"><span class="flabel">Colour</span>${LW.colorSelect(S.color, 'outfitColor')}</div>
      <label class="switch"><span>Clean and ready</span><input type="checkbox" data-sbind="clean" ${S.clean ? 'checked' : ''}></label>
      <button class="btn" data-act="outfitSave">Save</button>
      ${S.isNew ? '' : `<button class="btn g" data-act="outfitTomorrow">Hang it out for tomorrow ✦</button><button class="btn danger" data-act="outfitDel">Delete</button>`}`;
  }
  A.outfitNew = () => LW.openSheet(outfitSheet, { isNew: true, id: LW.uid(), name: '', emoji: '👗', notes: '', style: (LW.state.wardrobe.styles[0] || {}).id || '', color: 'pink', clean: true });
  A.outfitOpen = (d) => LW.openSheet(outfitSheet, { ...LW.byId(LW.state.wardrobe.outfits, d.id) });
  A.outfitSet = (d) => {
    LW.S.style = d.style;
    LW.renderSheet();
  };
  A.outfitColor = (d) => {
    LW.S.color = d.color;
    LW.renderSheet();
  };
  A.outfitSave = () => {
    const S = LW.S;
    const o = { id: S.id, name: (S.name || '').trim() || 'Outfit', emoji: S.emoji || '👗', notes: S.notes || '', style: S.style, color: S.color, clean: !!S.clean };
    const ex = LW.byId(LW.state.wardrobe.outfits, o.id);
    if (ex) Object.assign(ex, o);
    else LW.state.wardrobe.outfits.push(o);
    LW.closeSheet();
    LW.refresh();
  };
  A.outfitTomorrow = () => {
    A.outfitSave();
    LW.state.wardrobe.tomorrow = LW.S.id || LW.state.wardrobe.outfits[LW.state.wardrobe.outfits.length - 1].id;
    LW.refresh();
  };
  A.outfitDel = () => {
    LW.remove(LW.state.wardrobe.outfits, LW.S.id);
    LW.closeSheet();
    LW.refresh();
  };
  A.outfitRandom = () => {
    const W = LW.state.wardrobe;
    const clean = W.outfits.filter((o) => o.clean && o.id !== W.tomorrow);
    const pool = clean.length ? clean : W.outfits.filter((o) => o.clean);
    if (!pool.length) return LW.toast(W.outfits.length ? 'Everything is in the wash. Laundry time? 🧺' : 'Build an outfit first');
    W.tomorrow = LW.pick(pool).id;
    LW.toast('Picked for you ✦');
    LW.refresh();
  };
  A.outfitWear = (d) => {
    const W = LW.state.wardrobe;
    const o = LW.byId(W.outfits, d.id);
    o.clean = false;
    W.tomorrow = '';
    LW.refresh();
  };
  A.laundryDone = () => {
    LW.state.wardrobe.outfits.forEach((o) => (o.clean = true));
    LW.sparkle('laundry');
    LW.refresh();
  };
  A.styleAdd = () => {
    LW.state.wardrobe.styles.push({ id: LW.uid(), name: 'New style', desc: '' });
    LW.refresh();
  };
  A.styleDel = (d) => {
    if (!confirm('Remove this style? Outfits stay, they just lose their style.')) return;
    LW.remove(LW.state.wardrobe.styles, d.id);
    LW.refresh();
  };
})();
