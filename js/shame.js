/* Lost Wings – shame journey companion, compliments jar, pause sheet */
(function () {
  'use strict';
  const { esc } = LW;
  const A = LW.actions;
  const pauseBtn = `<button class="chip p pause-fab" data-act="pause">⏸ pause</button>`;

  LW.views.shame = function () {
    const Sh = LW.state.shame;
    if (!Sh.acknowledged)
      return `${LW.back('#/toolkit', 'Toolkit')}<h1>Before you begin</h1>
        <div class="c p fill-p">This part of the app works with internalised shame, which can bring up heavy feelings.<br><br>
        It isn't therapy. Go slowly, take breaks, and stop whenever you need to. There are no deadlines here, ever.<br><br>
        If you ever feel unsafe or have thoughts of not wanting to be here, contact your local crisis line or emergency services straight away.</div>
        <h2>A gentle readiness check</h2>
        <div class="c">${['I have some support in place (a person, a therapist, a group)', 'I have time and space to go slowly', 'I know I can pause or stop at any time']
          .map((t, i) => LW.tick((LW.tmp.ready || [])[i], t, 'readyTick', `data-i="${i}"`, 'nostrike'))
          .join('')}</div>
        <p class="tiny">You don't need all three. They're just worth thinking about.</p>
        <button class="btn" data-act="shameStart">I'm ready to start, slowly</button>
        <a class="btn g" href="#/toolkit">Not today</a>`;
    const next = Sh.tasks.find((t) => !t.done);
    return `${pauseBtn}${LW.back('#/toolkit', 'Toolkit')}<h1>Your journey</h1><p class="sub">Your pace. No deadlines.</p>
      ${Sh.tasks
        .map((t, i) => {
          const here = next && t.id === next.id;
          return `<a class="c ${t.done ? 'm' : here ? 'p' : ''}" href="#/shame/${t.id}" style="${!t.done && !here ? 'opacity:.75' : ''}"><div class="tick nostrike ${t.done ? 'done' : ''}"><i></i><span>${here ? '<b>' : ''}${i + 1} · ${esc(t.title)}${here ? '</b>' : ''}</span></div>${here ? '<div class="tiny" style="margin-left:30px">You\'re here, whenever you\'re ready</div>' : ''}</a>`;
        })
        .join('')}
      <div class="grid2" style="margin-top:6px"><a class="c y" href="#/jar"><b>✨ Compliments jar</b><div class="tiny">${LW.plural(Sh.jar.length, 'piece')} of evidence</div></a>
      <a class="c s" href="#/stories"><b>📖 Old story / true</b><div class="tiny">${LW.plural(Sh.stories.length, 'card')}</div></a></div>
      <h2>Mantras</h2><div class="c p">${Sh.mantras.map((m) => `<div style="margin:4px 0">"${esc(m)}"</div>`).join('') || '<div class="tiny">Add words that soothe you.</div>'}
        <button class="linkish tiny" data-act="mantrasEdit">Edit mantras</button></div>
      <button class="btn g" data-act="pause">Open my pause sheet</button>`;
  };
  A.readyTick = (d) => {
    LW.tmp.ready = LW.tmp.ready || [];
    LW.tmp.ready[d.i] = !LW.tmp.ready[d.i];
    LW.render();
  };
  A.shameStart = () => {
    LW.state.shame.acknowledged = true;
    LW.refresh();
  };
  A.mantrasEdit = () =>
    LW.openSheet(() => `<h2>Your mantras</h2><p class="sub">Words to soothe shame when it pops up.</p>${LW.stringListEditor('shame.mantras', LW.state.shame.mantras, 'New mantra')}<button class="btn" data-act="sheetDone">Done</button>`);

  LW.views.shameTask = function (id) {
    const Sh = LW.state.shame;
    const t = LW.byId(Sh.tasks, id);
    if (!t) return `${LW.back('#/shame')}<p class="empty">Not found.</p>`;
    const i = Sh.tasks.indexOf(t);
    return `${pauseBtn}${LW.back('#/shame', 'Your journey')}
      <div class="lab">Task ${i + 1} of ${Sh.tasks.length}</div>
      <input type="text" class="inline-in" style="font-size:1.3rem;font-weight:700;color:var(--blue);width:100%" value="${esc(t.title)}" data-bind="shame.tasks.#${t.id}.title" aria-label="Task title">
      <p class="sub">Take this as slowly as you need. Your book has the full guidance for this step.</p>
      <div class="field"><label>Private journal</label><textarea data-bind="shame.tasks.#${t.id}.journal" style="min-height:220px" placeholder="Write whatever comes. Only you will ever see this.">${esc(t.journal)}</textarea></div>
      <button class="btn ${t.done ? 'g' : ''}" data-act="shameDone" data-id="${t.id}">${t.done ? 'Mark as not finished' : 'I feel done with this one, for now'}</button>
      <a class="btn g" href="#/shame">Close gently for today</a>`;
  };
  A.shameDone = (d) => {
    const t = LW.byId(LW.state.shame.tasks, d.id);
    t.done = !t.done;
    LW.save();
    if (t.done) LW.toast('That took courage ✦');
    location.hash = '#/shame';
  };

  /* ---------- jar ---------- */
  LW.views.jar = function () {
    const jar = LW.state.shame.jar;
    const shown = LW.byId(jar, LW.tmp.jarPick) || jar[jar.length - 1];
    const stars = Array.from({ length: Math.min(jar.length, 14) }, (_, i) => {
      const x = 34 + ((i * 37) % 52),
        y = 132 - Math.floor(i / 3) * 14 - (i % 2) * 4;
      return `<text x="${x}" y="${y}" font-size="${14 + (i % 3) * 2}">✦</text>`;
    }).join('');
    return `${LW.back(LW.on('shame') && LW.state.shame.acknowledged ? '#/shame' : '#/toolkit')}<h1 class="center">Compliments jar</h1><p class="sub center">Evidence for what's actually true</p>
      <svg viewBox="0 0 120 150" class="jar ${LW.tmp.shake ? 'shake' : ''}" aria-hidden="true"><rect x="35" y="8" width="50" height="14" rx="4" fill="var(--pinkL)" stroke="var(--pink)" stroke-width="2"/><path d="M30 24 h60 q10 0 10 14 v92 q0 12 -12 12 h-56 q-12 0 -12 -12 v-92 q0 -14 10 -14z" fill="#fff" stroke="var(--lavM)" stroke-width="3"/><g fill="var(--yelM)">${stars}</g></svg>
      <div class="tiny center">${LW.plural(jar.length, 'piece')} of evidence</div>
      ${shown ? `<div class="c y fill-y" style="margin-top:10px">"${esc(shown.text)}"<div class="tiny">${shown.from ? 'From ' + esc(shown.from) + ' · ' : ''}${LW.fmtDate(shown.date, { month: 'long', year: 'numeric' })}</div></div>` : '<p class="empty">Add kind things people have said, things you\'re proud of, proof you matter.</p>'}
      <button class="btn" data-act="jarAdd">Add evidence</button>
      ${jar.length > 1 ? '<button class="btn g" data-act="jarShake">Shake the jar (random one)</button>' : ''}
      ${jar.length ? `<details class="c" style="margin-top:12px"><summary><b>Everything in the jar</b></summary>${jar
        .slice()
        .reverse()
        .map((j) => `<div class="edit-row"><span style="flex:1">"${esc(j.text)}"${j.from ? ` <span class="tiny">– ${esc(j.from)}</span>` : ''}</span><button class="icon-btn" data-act="jarDel" data-id="${j.id}" aria-label="Remove">✕</button></div>`)
        .join('')}</details>` : ''}`;
  };
  A.jarAdd = () =>
    LW.openSheet(
      (S) => `<h2>Add evidence</h2>
      <div class="field"><label>What was said, or what happened</label><textarea data-sbind="text" autofocus placeholder="You make every room lighter.">${esc(S.text)}</textarea></div>
      <div class="field"><label>From (optional)</label><input type="text" data-sbind="from" value="${esc(S.from)}" placeholder="a colleague, my sister, me"></div>
      <button class="btn" data-act="jarSave">Pop it in the jar ✦</button>`,
      { text: '', from: '' }
    );
  A.jarSave = () => {
    const t = (LW.S.text || '').trim();
    if (!t) return;
    const j = { id: LW.uid(), text: t, from: (LW.S.from || '').trim(), date: LW.today() };
    LW.state.shame.jar.push(j);
    LW.tmp.jarPick = j.id;
    LW.sparkle('jar');
    LW.closeSheet();
    LW.refresh();
  };
  A.jarShake = () => {
    const jar = LW.state.shame.jar;
    const others = jar.filter((j) => j.id !== LW.tmp.jarPick);
    LW.tmp.jarPick = LW.pick(others.length ? others : jar).id;
    LW.tmp.shake = true;
    LW.render();
    setTimeout(() => (LW.tmp.shake = false), 600);
  };
  A.jarDel = (d) => {
    if (!confirm('Take this out of the jar?')) return;
    LW.remove(LW.state.shame.jar, d.id);
    LW.refresh();
  };

  /* ---------- old story / what's true ---------- */
  LW.views.stories = function () {
    const st = LW.state.shame.stories;
    return `${pauseBtn}${LW.back('#/shame', 'Your journey')}<h1>Old story / what's true</h1><p class="sub">Write the old story shame tells you, then what's actually true.</p>
      ${st
        .map(
          (s) => `<div class="c"><div class="lab">Old story</div><textarea data-bind="shame.stories.#${s.id}.old" style="min-height:54px">${esc(s.old)}</textarea>
        <div class="lab" style="margin-top:8px;color:#2f9e63">What's actually true</div><textarea data-bind="shame.stories.#${s.id}.truth" style="min-height:54px">${esc(s.truth)}</textarea>
        <button class="linkish tiny" data-act="storyDel" data-id="${s.id}">Remove card</button></div>`
        )
        .join('')}
      <button class="btn g" data-act="storyAdd">+ New card</button>`;
  };
  A.storyAdd = () => {
    LW.state.shame.stories.push({ id: LW.uid(), old: '', truth: '' });
    LW.refresh();
  };
  A.storyDel = (d) => {
    if (!confirm('Remove this card?')) return;
    LW.remove(LW.state.shame.stories, d.id);
    LW.refresh();
  };

  /* ---------- pause sheet ---------- */
  function pauseSheet(S) {
    const Sh = LW.state.shame;
    if (S.editing)
      return `<h2>My support people</h2><p class="sub">People you can reach when things feel heavy.</p>
        ${Sh.safe
          .map(
            (p) => `<div class="edit-row"><input type="text" value="${esc(p.name)}" data-bind="shame.safe.#${p.id}.name" placeholder="Name"><input type="tel" value="${esc(p.contact)}" data-bind="shame.safe.#${p.id}.contact" placeholder="Phone number"><button class="icon-btn" data-act="safeDel" data-list="safe" data-id="${p.id}">✕</button></div>`
          )
          .join('')}
        <button class="btn sm g" data-act="safeAdd" data-list="safe">+ Add a person</button>
        <h2>Crisis contacts for where I live</h2><p class="sub">Look up your local crisis line and emergency number and save them here, so they're one tap away.</p>
        ${Sh.crisis
          .map(
            (p) => `<div class="edit-row"><input type="text" value="${esc(p.name)}" data-bind="shame.crisis.#${p.id}.name" placeholder="e.g. Crisis line"><input type="tel" value="${esc(p.contact)}" data-bind="shame.crisis.#${p.id}.contact" placeholder="Number"><button class="icon-btn" data-act="safeDel" data-list="crisis" data-id="${p.id}">✕</button></div>`
          )
          .join('')}
        <button class="btn sm g" data-act="safeAdd" data-list="crisis">+ Add a crisis contact</button>
        <button class="btn" data-act="pauseEditDone">Done</button>`;
    const tel = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;
    return `<h2>Pausing is allowed</h2><p class="sub">You can come back any time, or not.</p>
      <div class="c s"><div class="lab">Breathe</div>In for 4, hold for 4, out for 6.
        ${S.breathing ? `<div class="breathe" id="breathe">${esc(S.phase || 'In')}</div>` : ''}
        <button class="btn g" data-act="breathe">${S.breathing ? 'Stop' : 'Start breathing'}</button></div>
      <div class="c m"><div class="lab">Reach someone safe</div>${
        Sh.safe.length ? Sh.safe.map((p) => `<div class="row" style="padding:3px 0"><span>♡ ${esc(p.name)}</span><span class="sp"></span>${p.contact ? `<a class="chip m" href="sms:${esc(String(p.contact).replace(/[^\d+]/g, ''))}">message</a><a class="chip" href="${tel(p.contact)}">call</a>` : ''}</div>`).join('') : '<div class="tiny">Add someone you trust.</div>'
      }</div>
      <div class="c p"><div class="lab">Need more support?</div><div class="tiny">If you feel unsafe or have thoughts of not wanting to be here, contact your local crisis line or emergency services.</div>
        ${Sh.crisis.map((p) => `<div class="row" style="padding:3px 0"><b>${esc(p.name)}</b><span class="sp"></span>${p.contact ? `<a class="chip p" href="${tel(p.contact)}">call ${esc(p.contact)}</a>` : ''}</div>`).join('')}
      </div>
      <button class="btn g" data-act="pauseEdit">Edit my contacts</button>
      <button class="btn" data-act="pauseClose">Close gently for today</button>`;
  }
  let breathTimer = null;
  const stopBreath = () => {
    clearTimeout(breathTimer);
    breathTimer = null;
  };
  A.pause = () => LW.openSheet(pauseSheet, {});
  A.pauseEdit = () => {
    stopBreath();
    LW.S.breathing = false;
    LW.S.editing = true;
    LW.renderSheet();
  };
  A.pauseEditDone = () => {
    LW.S.editing = false;
    LW.save();
    LW.renderSheet();
  };
  A.safeAdd = (d) => {
    LW.state.shame[d.list].push({ id: LW.uid(), name: '', contact: '' });
    LW.save();
    LW.renderSheet();
  };
  A.safeDel = (d) => {
    LW.remove(LW.state.shame[d.list], d.id);
    LW.save();
    LW.renderSheet();
  };
  A.pauseClose = () => {
    stopBreath();
    LW.closeSheet();
    location.hash = '#/today';
  };
  A.breathe = () => {
    if (LW.S.breathing) {
      stopBreath();
      LW.S.breathing = false;
      return LW.renderSheet();
    }
    LW.S.breathing = true;
    LW.renderSheet();
    const phases = [
      ['In', 'in', 4000],
      ['Hold', 'in', 4000],
      ['Out', 'out', 6000],
    ];
    let i = 0;
    const step = () => {
      const el = document.getElementById('breathe');
      if (!el || !LW.S.breathing) return stopBreath();
      const [label, cls, ms] = phases[i % 3];
      LW.S.phase = label;
      el.textContent = label;
      el.className = 'breathe ' + cls;
      i++;
      breathTimer = setTimeout(step, ms);
    };
    setTimeout(step, 50);
  };
})();
