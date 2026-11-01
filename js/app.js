/* Lost Wings – router, tabs and start-up */
(function () {
  'use strict';
  const V = LW.views;

  const ROUTES = [
    [/^welcome$/, () => V.welcome(), null],
    [/^today$/, () => V.today(), 'today'],
    [/^wing$/, () => V.wing(), 'today'],
    [/^wing\/result$/, () => V.wingResult(), 'today'],
    [/^wing\/history$/, () => V.wingHistory(), 'toolkit'],
    [/^slip$/, () => V.slip(), 'today'],
    [/^routines$/, () => V.routines(), 'routines'],
    [/^routine\/([\w-]+)$/, (m) => V.routine(m[1]), 'routines'],
    [/^routine\/([\w-]+)\/run$/, (m, q) => V.run(m[1], q), null],
    [/^leave\/([\w-]+)$/, (m) => V.leave(m[1]), 'routines'],
    [/^energy$/, () => V.energy(), 'energy'],
    [/^energy\/rules$/, () => V.energyRules(), 'energy'],
    [/^people$/, () => V.people(), 'energy'],
    [/^person\/([\w-]+)$/, (m) => V.person(m[1]), 'energy'],
    [/^toolkit$/, () => V.toolkit(), 'toolkit'],
    [/^audit$/, () => V.audit(), 'toolkit'],
    [/^chaos$/, () => V.chaos(), 'toolkit'],
    [/^chaos\/new$/, () => V.chaosNew(), 'today'],
    [/^chaos\/filed$/, () => V.chaosFiled(), 'today'],
    [/^wardrobe$/, () => V.wardrobe(), 'toolkit'],
    [/^shame$/, () => V.shame(), 'toolkit'],
    [/^shame\/([\w-]+)$/, (m) => V.shameTask(m[1]), 'toolkit'],
    [/^jar$/, () => V.jar(), 'toolkit'],
    [/^stories$/, () => V.stories(), 'toolkit'],
    [/^me$/, () => V.me(), 'me'],
    [/^certificate$/, () => V.certificate(), 'me'],
    [/^settings$/, () => V.settings(), 'me'],
    [/^settings\/today$/, () => V.settingsToday(), 'me'],
    [/^settings\/data$/, () => V.settingsData(), 'me'],
    [/^about$/, () => V.about(), 'me'],
  ];

  function tabsFor() {
    const on = LW.on;
    const t = [['today', '✦', 'Today']];
    if (on('routines') || on('leave')) t.push(['routines', '☀', 'Routines']);
    if (on('energy') || on('people')) t.push(['energy', '⚡', 'Energy']);
    t.push(['toolkit', '✿', 'Toolkit']);
    t.push(['me', '♡', 'Me']);
    return t;
  }

  function parse() {
    const raw = (location.hash || '#/today').replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const q = {};
    (qs || '').split('&').forEach((p) => {
      if (!p) return;
      const [k, v] = p.split('=');
      q[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return { path: path || 'today', q };
  }

  let lastPath = null;
  LW.render = function () {
    const { path, q } = parse();
    if (!LW.state.onboarded && path !== 'welcome') {
      location.replace('#/welcome');
      return;
    }
    let html = '',
      tab = null,
      found = false;
    for (const [re, fn, t] of ROUTES) {
      const m = path.match(re);
      if (m) {
        try {
          html = fn(m, q);
        } catch (e) {
          console.error(e);
          html = `<p class="empty">Something went a bit Chaos Bunny here. <a href="#/today">Back to Today</a></p>`;
        }
        tab = t;
        found = true;
        break;
      }
    }
    if (!found) {
      location.replace('#/today');
      return;
    }
    const view = document.getElementById('view');
    view.innerHTML = html;
    const nav = document.getElementById('tabs');
    if (tab) {
      nav.innerHTML = `<div class="in">${tabsFor()
        .map(([id, ic, label]) => `<a href="#/${id}" class="${id === tab ? 'on' : ''}" ${id === tab ? 'aria-current="page"' : ''}><i>${ic}</i>${label}</a>`)
        .join('')}</div>`;
      document.body.classList.remove('no-tabs');
    } else {
      nav.innerHTML = '';
      document.body.classList.add('no-tabs');
    }
    if (path !== lastPath) {
      window.scrollTo(0, 0);
      lastPath = path;
    }
  };

  window.addEventListener('hashchange', () => {
    if (LW.sheetOpen()) LW.closeSheet();
    LW.render();
  });

  function trackVisit() {
    const m = LW.state.meta;
    const t = LW.today();
    if (m.lastOpen && m.lastOpen !== t) {
      const gap = LW.daysBetween(m.lastOpen, t);
      if (gap >= 7) {
        LW.tmp.welcomeBack = gap;
        LW.sparkle('came_back');
      }
    }
    m.lastOpen = t;
    if (!m.visits.includes(t)) m.visits.push(t);
    m.visits = m.visits.slice(-120);
    LW.save();
  }

  /* re-check the date when the app comes back from the background, so ticks clear on a new day */
  let day = null;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && day !== LW.today()) {
      day = LW.today();
      trackVisit();
      if (!LW.sheetOpen()) LW.render();
    }
  });

  LW.load();
  LW.applyPrefs();
  day = LW.today();
  trackVisit();
  LW.render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
