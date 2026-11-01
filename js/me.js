/* Lost Wings – Me tab: sparkles, certificate, settings, personalisation, data, onboarding */
(function () {
  'use strict';
  const { esc } = LW;
  const A = LW.actions;

  const BEFORE = `I'm not a therapist, psychologist, doctor or coach. This app comes from my own life and what helped me.<br><br>
    Take what helps and leave the rest. You know yourself best.<br><br>
    If you ever feel unsafe, contact your local crisis line or emergency services.<br><br><span style="color:var(--pink)">– Belle</span>`;

  /* ---------- Me ---------- */
  LW.views.me = function () {
    const st = LW.state.settings;
    const sp = LW.state.sparkles;
    let html = `<h1>${esc(LW.name() || 'Me')} ♡</h1><p class="sub">Private · everything stays on this phone</p>`;
    if (LW.on('sparkles')) {
      const n = LW.sparkleCount();
      const visits = LW.state.meta.visits.filter((k) => k >= LW.addDays(LW.today(), -30)).length;
      html += `<h2>My sparkles</h2><p class="sub">${n} collected · no rush · you've shown up ${LW.plural(visits, 'day')} this month</p>
        <div class="grid3">${LW.SPARKLES.map((s, i) => {
          const got = sp.earned[s.id];
          return `<div class="c ${['y', 'p', 's', 'm', 'o', ''][i % 6]} sparkle ${got ? '' : 'locked'}" title="${esc(s.desc)}"><div class="ic">${got ? s.icon : '?'}</div><div class="tiny">${esc(s.name)}</div></div>`;
        }).join('')}
        ${sp.custom.map((c) => `<div class="c y sparkle"><div class="ic">${esc(c.icon || '✦')}</div><div class="tiny">${esc(c.name)}</div></div>`).join('')}</div>
        <button class="btn g" data-act="customSparkle">Give myself a sparkle ✦</button>
        <details class="c" style="margin-top:10px"><summary class="tiny">How do I get sparkles?</summary>${LW.SPARKLES.map((s) => `<div class="tiny" style="margin:4px 0"><b>${s.icon} ${esc(s.name)}</b>: ${esc(s.desc)}</div>`).join('')}<div class="tiny" style="margin-top:6px">No streaks, ever. Sparkles are for showing up, not for keeping up.</div></details>
        <a class="c y fill-y" href="#/certificate" style="margin-top:10px"><div class="row"><span style="font-size:1.6rem;color:#e6c800">♛</span><div><b>${esc(st.title)} of Devotion certificate</b><div class="tiny">${n >= LW.CERT_NEEDED ? 'Unlocked! Tap to see it.' : `Unlocks with a mix of ${LW.CERT_NEEDED} sparkles (${n} so far). Never by a streak.`}</div></div></div></a>`;
    }
    html += `<h2>Make it mine</h2>
      <a class="c" href="#/settings"><b>⚙︎ Settings and personalisation</b><div class="tiny">Your name, tools, colours, text size, Chaos mode</div></a>
      <a class="c" href="#/settings/today"><b>✦ Arrange my Today screen</b><div class="tiny">Choose and order the cards you see</div></a>
      <a class="c" href="#/settings/data"><b>🔒 My data</b><div class="tiny">Back up, restore, or start fresh</div></a>
      <a class="c" href="#/about"><b>♡ Before you begin</b><div class="tiny">The promise from the book</div></a>`;
    return html;
  };
  A.customSparkle = () =>
    LW.openSheet(
      (S) => `<h2>Give yourself a sparkle</h2><p class="sub">For anything. Answered a scary email? Ate a vegetable? Got out of bed? Sparkle.</p>
      <div class="row"><input type="text" data-sbind="icon" value="${esc(S.icon)}" style="width:60px;text-align:center;font-size:1.3rem" aria-label="Icon"><input type="text" data-sbind="name" autofocus placeholder="What did you do?" data-enter="customSparkleSave"></div>
      <button class="btn" data-act="customSparkleSave">Add sparkle ✦</button>`,
      { icon: '✦', name: '' }
    );
  A.customSparkleSave = () => {
    const nm = (LW.S.name || '').trim();
    if (!nm) return;
    LW.state.sparkles.custom.push({ id: LW.uid(), icon: LW.S.icon || '✦', name: nm, date: LW.today() });
    LW.closeSheet();
    LW.toast('✦ Well deserved');
    LW.refresh();
  };

  LW.views.certificate = function () {
    const st = LW.state.settings;
    const n = LW.sparkleCount();
    if (n < LW.CERT_NEEDED)
      return `${LW.back('#/me', 'Me')}<div class="cert" style="opacity:.6"><div class="crown">♛</div><div class="tiny">Your certificate is waiting</div><div class="tt">${esc(st.title)} of Devotion</div></div>
        <p class="sub center" style="margin-top:12px">${n} of ${LW.CERT_NEEDED} sparkles. It unlocks with a mix of sparkles, whenever they happen. No rush.</p>`;
    return `${LW.back('#/me', 'Me')}
      <div class="cert printable"><div class="crown">♛</div><div class="tiny" style="color:var(--pink)">This certifies that</div>
      <div class="nm">${esc(LW.name() || 'You')}</div><div class="tiny" style="color:var(--pink)">is now an official</div>
      <div class="tt">${esc(st.title)} of Devotion</div><div class="tiny">for hopping out of burnout and getting their wings back</div>
      <div style="color:var(--pinkD);letter-spacing:5px;margin-top:8px">✦ ♡ ✦</div><div class="tiny">${LW.fmtDate(LW.today(), { day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
      <div class="field" style="margin-top:14px"><label>Title on the certificate</label>${LW.chipsSelect(['Queen', 'King', 'Monarch', 'Ruler'].map((t) => [t, t, '']), st.title, 'setTitle')}
        <input type="text" value="${esc(st.title)}" data-bind="settings.title" style="margin-top:6px" aria-label="Custom title"></div>
      <button class="btn" data-act="print">Save or print</button>`;
  };
  A.setTitle = (d) => {
    LW.state.settings.title = d.v;
    LW.refresh();
  };
  A.print = () => window.print();

  /* ---------- settings ---------- */
  LW.views.settings = function () {
    const st = LW.state.settings;
    return `${LW.back('#/me', 'Me')}<h1>Settings</h1>
      <div class="field"><label>What should the app call you?</label><input type="text" value="${esc(st.name)}" data-bind="settings.name" placeholder="Your name or nickname"></div>
      <h2>My toolkit</h2><p class="sub">Switch on only what helps. Everything else stays hidden.</p>
      <div class="c">${Object.entries(LW.TOOLS)
        .map(([k, t]) => LW.switch(`settings.tools.${k}`, st.tools[k], `${t.icon} ${esc(t.name)}`, 'data-rerender'))
        .join('')}</div>
      <h2>Tone</h2>
      <div class="c">${LW.switch('settings.chaosMode', st.chaosMode, '<b>Chaos mode</b><div class="tiny">Cheekier, slightly sweary copy. Off by default.</div>', 'data-rerender')}</div>
      <h2>Look and feel</h2>
      <div class="field"><span class="flabel">Accent colour</span>${LW.chipsSelect(
        [
          ['pink', 'pink', 'p'],
          ['sky', 'sky', 's'],
          ['lavender', 'lavender', ''],
          ['mint', 'mint', 'm'],
          ['peach', 'peach', 'o'],
        ],
        st.accent,
        'setPref',
        'accent'
      )}</div>
      <div class="field"><span class="flabel">Text size</span>${LW.chipsSelect(
        [
          ['normal', 'Normal', ''],
          ['large', 'Large', ''],
          ['xl', 'Extra large', ''],
        ],
        st.textSize,
        'setPref',
        'size'
      )}</div>
      <div class="c">${LW.switch('settings.reduceMotion', st.reduceMotion, 'Reduce motion', 'data-rerender')}</div>
      <h2>Add to your Home Screen</h2>
      <div class="note">On iPhone: open this page in Safari, tap the Share button, then <b>Add to Home Screen</b>. Lost Wings gets its own icon and opens like an app, and it works offline.</div>`;
  };
  A.setPref = (d) => {
    if (d.accent) LW.state.settings.accent = d.accent;
    if (d.size) LW.state.settings.textSize = d.size;
    LW.sparkle('personal');
    LW.applyPrefs();
    LW.refresh();
  };
  LW.applyPrefs = () => {
    const st = LW.state.settings;
    const h = document.documentElement;
    h.dataset.accent = st.accent;
    h.dataset.size = st.textSize;
    h.dataset.motion = st.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : '';
  };

  LW.views.settingsToday = function () {
    const st = LW.state.settings;
    return `${LW.back('#/me', 'Me')}<h1>Arrange Today</h1><p class="sub">Choose which cards show on Today, and in what order.</p>
      ${st.todayCards
        .map((c) => {
          const enabled = LW.on(LW.CARD_TOOL[c.id]);
          return `<div class="c" style="${enabled ? '' : 'opacity:.5'}"><div class="row"><input type="checkbox" data-bind="settings.todayCards.#${c.id}.on" ${c.on ? 'checked' : ''} aria-label="Show ${esc(LW.CARD_NAMES[c.id])}">
          <span style="flex:1">${esc(LW.CARD_NAMES[c.id])}${enabled ? '' : '<div class="tiny">tool switched off</div>'}</span>
          <button class="icon-btn" data-act="cardMove" data-id="${c.id}" data-dir="-1" aria-label="Move up">↑</button><button class="icon-btn" data-act="cardMove" data-id="${c.id}" data-dir="1" aria-label="Move down">↓</button></div></div>`;
        })
        .join('')}
      <a class="btn" href="#/today">See my Today</a>`;
  };
  A.cardMove = (d) => {
    LW.move(LW.state.settings.todayCards, d.id, Number(d.dir));
    LW.sparkle('personal');
    LW.refresh();
  };

  /* ---------- data ---------- */
  LW.views.settingsData = function () {
    return `${LW.back('#/me', 'Me')}<h1>My data</h1>
      <div class="note">🔒 Everything you put in Lost Wings is stored only on this device, in this browser. Nothing is sent anywhere. That also means if you delete the app or clear your browser data, it's gone, so back up now and then.</div>
      <button class="btn" data-act="exportData">Back up (download a file)</button>
      <label class="btn g" style="cursor:pointer">Restore from a backup<input type="file" accept="application/json,.json" id="import-file" data-change="importData" hidden></label>
      <h2>Start fresh</h2>
      <button class="btn danger" data-act="resetData">Delete everything and start again</button>`;
  };
  A.exportData = () => {
    const blob = new Blob([JSON.stringify(LW.state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lost-wings-backup-${LW.today()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  };
  A.importData = (d, el) => {
    const f = el.files && el.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data || typeof data !== 'object' || !data.settings || !data.wing) throw new Error('bad');
        if (!confirm('Replace everything in the app with this backup?')) return;
        localStorage.setItem('lostwings.v1', JSON.stringify(data));
        LW.load();
        LW.applyPrefs();
        LW.toast('Backup restored ✦');
        location.hash = '#/today';
        LW.render();
      } catch (e) {
        LW.toast("That file doesn't look like a Lost Wings backup.");
      }
    };
    r.readAsText(f);
  };
  A.resetData = () => {
    if (!confirm('Delete everything in Lost Wings on this device? This cannot be undone.')) return;
    localStorage.removeItem('lostwings.v1');
    LW.load();
    LW.applyPrefs();
    location.hash = '#/welcome';
    LW.render();
  };

  LW.views.about = () => `${LW.back('#/me', 'Me')}<h1>Before you begin</h1><div class="c p fill-p">${BEFORE}</div>
    <h2>The promises</h2><div class="c"><b>No guilt.</b> No streaks, no red, no "you missed".<br><b>Private by default.</b> Everything stays on your phone.<br><b>Gentle.</b> Low days get kindness, not tasks.<br><b>Yours.</b> Rename, reorder and rewrite anything.</div>`;

  /* ---------- onboarding ---------- */
  LW.views.welcome = function () {
    const step = LW.tmp.ob || 0;
    const st = LW.state.settings;
    if (step === 0)
      return `<div class="hero">${LW.bunny(90)}<h1>Lost Wings</h1><p style="margin:0">A gentle companion for hopping out of burnout and getting your wings back.</p></div>
        <h2>Before you begin</h2><div class="c p">${BEFORE}</div>
        <div class="c s">${LW.switch('settings.chaosMode', st.chaosMode, '<b>Chaos mode</b><div class="tiny">Cheekier, sweary copy. Switch on any time.</div>')}</div>
        <button class="btn" data-act="obNext">I understand ✦</button>`;
    if (step === 1)
      return `<h1>What would help?</h1><p class="sub">Pick anything. You can change this later.</p>
        ${Object.entries(LW.TOOLS)
          .map(([k, t]) => `<div class="c">${LW.tick(st.tools[k], `${t.icon} ${esc(t.name)}`, 'obTool', `data-k="${k}"`, 'nostrike')}</div>`)
          .join('')}
        <button class="btn" data-act="obNext">Next</button>`;
    return `<h1>Make it yours</h1>
      <div class="field"><label>What should the app call you?</label><input type="text" value="${esc(st.name)}" data-bind="settings.name" placeholder="Your name or nickname" autofocus></div>
      <div class="field"><span class="flabel">How would you like to start?</span>
        ${LW.chipsSelect(
          [
            ['ex', "With Belle's examples to edit", 'p'],
            ['blank', 'With blank lists', 's'],
          ],
          LW.tmp.obStart || 'ex',
          'obStart'
        )}
        <div class="tiny" style="margin-top:6px">Examples give you a morning and evening routine, some leave-the-house checklists and a sample wardrobe to change into your own. Everything is editable either way.</div></div>
      <div class="field"><span class="flabel">Pick a colour</span>${LW.chipsSelect(
        [
          ['pink', 'pink', 'p'],
          ['sky', 'sky', 's'],
          ['lavender', 'lavender', ''],
          ['mint', 'mint', 'm'],
          ['peach', 'peach', 'o'],
        ],
        st.accent,
        'setPref',
        'accent'
      )}</div>
      <button class="btn" data-act="obFinish">Let's go ✦</button>`;
  };
  A.obNext = () => {
    LW.tmp.ob = (LW.tmp.ob || 0) + 1;
    LW.save();
    LW.render();
    scrollTo(0, 0);
  };
  A.obTool = (d) => {
    const t = LW.state.settings.tools;
    t[d.k] = !t[d.k];
    LW.refresh();
  };
  A.obStart = (d) => {
    LW.tmp.obStart = d.v;
    LW.render();
  };
  A.obFinish = () => {
    const keep = LW.state.settings;
    if ((LW.tmp.obStart || 'ex') === 'blank') {
      const fresh = LW.defaults(false);
      fresh.settings = keep;
      fresh.sparkles = LW.state.sparkles;
      LW.state = fresh;
    }
    LW.state.onboarded = true;
    LW.tmp.ob = 0;
    LW.save(true);
    location.hash = '#/today';
  };
})();
