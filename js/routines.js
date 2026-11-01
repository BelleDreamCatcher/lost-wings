/* Lost Wings – routines by room, run mode, prep list, "Can I leave the house?" */
(function () {
  'use strict';
  const { esc } = LW;
  const A = LW.actions;

  LW.roomName = (id) => {
    const r = LW.byId(LW.state.routines.rooms, id);
    return r ? r.name : '';
  };
  LW.routineSteps = (r, low) => {
    const season = LW.state.routines.season;
    return r.steps.filter((s) => (s.season === 'all' || s.season === season) && (!low || s.low));
  };
  LW.nextRoutine = () => {
    const list = LW.state.routines.list.filter((r) => r.steps.length);
    if (!list.length) return null;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const toM = (t) => {
      const [h, m] = (t || '').split(':').map(Number);
      return isNaN(h) ? null : h * 60 + (m || 0);
    };
    const timed = list.filter((r) => toM(r.time) != null).sort((a, b) => toM(a.time) - toM(b.time));
    if (!timed.length) return list[0];
    // the routine whose time is closest ahead, allowing 90 minutes of grace after its time
    return timed.find((r) => toM(r.time) + 90 >= mins) || timed[0];
  };
  const seasonLabel = (s) => (s === 'all' ? 'All year' : LW.state.routines.seasonNames[s]);

  /* ---------- Routines tab ---------- */
  LW.views.routines = function () {
    const R = LW.state.routines;
    let html = `<h1>Routines</h1><p class="sub">${LW.c('Built by room, so you\'re not darting around the house.', 'Built by room, so you stop zig-zagging round the house like a startled bunny.')}</p>`;
    if (LW.on('routines')) {
      html += `<div class="row" style="margin-bottom:12px"><span class="lab" style="margin:0">Season</span><span class="sp"></span>${LW.chipsSelect(
        [
          ['warm', esc(R.seasonNames.warm), 's'],
          ['cold', esc(R.seasonNames.cold), 'm'],
        ],
        R.season,
        'setSeason'
      )}</div>`;
      html += R.list
        .map((r) => {
          const n = LW.routineSteps(r, false).length;
          const lown = LW.routineSteps(r, true).length;
          return `<div class="c s"><div class="row"><span style="font-size:1.4rem">${esc(r.emoji || '☀')}</span><div><b>${esc(r.name)}</b><div class="tiny">${LW.plural(n, 'step')}${r.time ? ' · ' + esc(r.time) : ''}${
            lown && lown < n ? ` · low-wing: ${lown}` : ''
          }</div></div><span class="sp"></span><a class="icon-btn" href="#/routine/${r.id}" aria-label="Edit ${esc(r.name)}">✎</a></div>
          <div class="row"><a class="btn sm" href="#/routine/${r.id}/run" ${n ? '' : 'aria-disabled="true"'}>Start</a>${lown && lown < n ? `<a class="btn sm g" href="#/routine/${r.id}/run?low=1">Low-wing version</a>` : ''}</div></div>`;
        })
        .join('');
      html += `<button class="btn g" data-act="routineAdd">+ New routine</button>`;
      html += `<h2>Future You: prepare tonight</h2><div class="c">${
        R.prep.length ? R.prep.map((it) => LW.tick(LW.isDoneToday(it), esc(it.text), 'prepTick', `data-id="${it.id}"`)).join('') : '<div class="tiny">What could Future You prepare tonight?</div>'
      }<div class="row" style="margin-top:6px"><button class="linkish tiny" data-act="prepEdit">Edit this list</button></div></div>`;
    }
    if (LW.on('leave')) {
      html += `<h2>Can I leave the house?</h2><p class="sub">Your own checklists for different kinds of outings.</p><div class="grid2">${LW.state.leave.lists
        .map((l) => {
          const done = l.items.filter(LW.isDoneToday).length;
          return `<a class="c o" href="#/leave/${l.id}"><div style="font-size:1.4rem">${esc(l.emoji || '🎒')}</div><b>${esc(l.name)}</b><div class="tiny">${done ? `${done}/${l.items.length} ticked` : LW.plural(l.items.length, 'item')}</div></a>`;
        })
        .join('')}<button class="c o" data-act="leaveAdd" style="text-align:center"><div style="font-size:1.4rem">＋</div><b>New checklist</b></button></div>`;
    }
    if (!LW.on('routines') && !LW.on('leave')) html += '<p class="empty">Routines are switched off. You can turn them on in Me › Settings.</p>';
    return html;
  };
  A.setSeason = (d) => {
    LW.state.routines.season = d.v;
    LW.refresh();
  };
  A.routineAdd = () => {
    const r = { id: LW.uid(), name: 'New routine', emoji: '✦', time: '', steps: [] };
    LW.state.routines.list.push(r);
    LW.save();
    location.hash = `#/routine/${r.id}`;
  };
  A.prepEdit = () =>
    LW.openSheet(() => {
      const prep = LW.state.routines.prep;
      return `<h2>Prepare tonight</h2><p class="sub">Little things Future You will thank you for. Ticks clear each morning.</p>
      ${prep
        .map(
          (it) =>
            `<div class="edit-row"><input type="text" value="${esc(it.text)}" data-bind="routines.prep.#${it.id}.text"><button class="icon-btn" data-act="prepDel" data-id="${it.id}" aria-label="Remove">✕</button></div>`
        )
        .join('')}
      <div class="edit-row"><input type="text" placeholder="Add something…" data-sbind="newPrep" data-enter="prepAdd" id="prep-new"><button class="icon-btn" data-act="prepAdd">＋</button></div>
      <button class="btn" data-act="sheetDone">Done</button>`;
    });
  A.prepDel = (d) => {
    LW.remove(LW.state.routines.prep, d.id);
    LW.refresh();
  };
  A.prepAdd = () => {
    const v = (document.getElementById('prep-new').value || '').trim();
    if (!v) return;
    LW.state.routines.prep.push({ id: LW.uid(), text: v, doneOn: '' });
    LW.refresh();
    document.getElementById('prep-new').focus();
  };

  /* ---------- Routine editor ---------- */
  LW.views.routine = function (id) {
    const R = LW.state.routines;
    const r = LW.byId(R.list, id);
    if (!r) return `${LW.back('#/routines')}<p class="empty">That routine isn't here any more.</p>`;
    const board = R.rooms
      .map((room) => {
        const items = r.steps.filter((s) => s.room === room.id);
        return `<div class="c s room-card"><div class="lab"><span>${esc(room.name)}</span><span class="tiny">${items.length || ''}</span></div>${
          items.length ? `<ul>${items.map((s) => `<li>${esc(s.text)}${s.season !== 'all' ? ` <span class="tiny">(${esc(seasonLabel(s.season))})</span>` : ''}</li>`).join('')}</ul>` : '<div class="tiny">—</div>'
        }</div>`;
      })
      .join('');
    const unplaced = r.steps.filter((s) => !LW.byId(R.rooms, s.room));
    const roomOpts = (sel) => `<option value="">No room</option>` + R.rooms.map((rm) => `<option value="${rm.id}" ${rm.id === sel ? 'selected' : ''}>${esc(rm.name)}</option>`).join('');
    const seasonOpts = (sel) =>
      ['all', 'warm', 'cold'].map((s) => `<option value="${s}" ${s === sel ? 'selected' : ''}>${esc(seasonLabel(s))}</option>`).join('');
    return `${LW.back('#/routines', 'Routines')}
      <div class="row"><input type="text" value="${esc(r.emoji || '')}" data-bind="routines.list.#${r.id}.emoji" style="width:56px;text-align:center;font-size:1.3rem" aria-label="Emoji">
        <input type="text" value="${esc(r.name)}" data-bind="routines.list.#${r.id}.name" style="font-weight:700;font-size:1.1rem" aria-label="Routine name"></div>
      <div class="row" style="margin-top:8px"><label class="flabel" style="margin:0" for="rt-time">Usual time</label><input id="rt-time" type="time" value="${esc(r.time || '')}" data-bind="routines.list.#${r.id}.time" style="width:auto"></div>

      <h2>By room</h2><p class="sub">Tap "Group by room" and the app puts tasks in room order, so you move through the house once.</p>
      <div class="grid2">${board}</div>
      ${unplaced.length ? `<div class="c p" style="margin-top:8px"><div class="lab">Not placed yet</div><div class="chips">${unplaced.map((s) => `<span class="chip p static">${esc(s.text)}</span>`).join('')}</div></div>` : ''}
      <div class="row"><button class="btn" data-act="routineSort" data-id="${r.id}">Group by room</button><button class="btn g" data-act="roomsEdit">Edit rooms</button></div>

      <h2>Steps, in order</h2>
      <p class="sub">🌱 = keep in the low-wing version.</p>
      ${
        r.steps.length
          ? r.steps
              .map(
                (s, i) => `<div class="c" style="padding:8px 10px">
          <div class="row"><span class="tiny" style="width:18px">${i + 1}</span><input type="text" class="inline-in" value="${esc(s.text)}" data-bind="routines.list.#${r.id}.steps.#${s.id}.text" aria-label="Step">
            <button class="icon-btn" data-act="stepMove" data-r="${r.id}" data-id="${s.id}" data-dir="-1" aria-label="Move up">↑</button>
            <button class="icon-btn" data-act="stepMove" data-r="${r.id}" data-id="${s.id}" data-dir="1" aria-label="Move down">↓</button>
            <button class="icon-btn" data-act="stepDel" data-r="${r.id}" data-id="${s.id}" aria-label="Delete">✕</button></div>
          <div class="row" style="margin-top:4px"><select data-bind="routines.list.#${r.id}.steps.#${s.id}.room" data-rerender aria-label="Room">${roomOpts(s.room)}</select>
            <select data-bind="routines.list.#${r.id}.steps.#${s.id}.season" data-rerender aria-label="Season">${seasonOpts(s.season)}</select>
            <label class="row tiny" style="gap:4px;flex:none">🌱<input type="checkbox" data-bind="routines.list.#${r.id}.steps.#${s.id}.low" aria-label="Keep in low-wing version" ${s.low ? 'checked' : ''}></label></div></div>`
              )
              .join('')
          : '<p class="empty">No steps yet. List everything you do, then drop each one into a room.</p>'
      }
      <div class="c"><div class="row"><input type="text" id="step-new" placeholder="Add a step…" data-enter="stepAdd" data-r="${r.id}">
        <select id="step-room" style="width:auto" aria-label="Room">${roomOpts(LW.tmp.lastRoom || '')}</select></div>
        <button class="btn sm" data-act="stepAdd" data-r="${r.id}">Add step</button></div>

      <h2>Season names</h2>
      <div class="grid2"><input type="text" value="${esc(LW.state.routines.seasonNames.warm)}" data-bind="routines.seasonNames.warm" aria-label="Warm season name"><input type="text" value="${esc(LW.state.routines.seasonNames.cold)}" data-bind="routines.seasonNames.cold" aria-label="Cold season name"></div>

      <a class="btn" href="#/routine/${r.id}/run" style="margin-top:18px">Run it now</a>
      <button class="btn danger" data-act="routineDel" data-id="${r.id}">Delete this routine</button>`;
  };
  const getR = (id) => LW.byId(LW.state.routines.list, id);
  A.stepAdd = (d) => {
    const inp = document.getElementById('step-new');
    const v = (inp.value || '').trim();
    if (!v) return;
    const room = document.getElementById('step-room').value;
    LW.tmp.lastRoom = room;
    getR(d.r).steps.push({ id: LW.uid(), text: v, room, season: 'all', low: false });
    LW.refresh();
    document.getElementById('step-new').focus();
  };
  A.stepMove = (d) => {
    LW.move(getR(d.r).steps, d.id, Number(d.dir));
    LW.refresh();
  };
  A.stepDel = (d) => {
    LW.remove(getR(d.r).steps, d.id);
    LW.refresh();
  };
  A.routineSort = (d) => {
    const r = getR(d.id);
    const order = LW.state.routines.rooms.map((x) => x.id);
    const rank = (s) => {
      const i = order.indexOf(s.room);
      return i < 0 ? 999 : i;
    };
    r.steps = r.steps.map((s, i) => [s, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([s]) => s);
    LW.toast('Grouped by room ✦');
    LW.refresh();
  };
  A.routineDel = (d) => {
    if (!confirm('Delete this routine? This cannot be undone.')) return;
    LW.remove(LW.state.routines.list, d.id);
    LW.save();
    location.hash = '#/routines';
  };
  A.roomsEdit = () =>
    LW.openSheet(() => {
      const rooms = LW.state.routines.rooms;
      return `<h2>Your rooms</h2><p class="sub">Put them in the order you usually move through your home. "Group by room" follows this order.</p>
      ${rooms
        .map(
          (rm) => `<div class="edit-row"><input type="text" value="${esc(rm.name)}" data-bind="routines.rooms.#${rm.id}.name" aria-label="Room name">
        <button class="icon-btn" data-act="roomMove" data-id="${rm.id}" data-dir="-1" aria-label="Move up">↑</button><button class="icon-btn" data-act="roomMove" data-id="${rm.id}" data-dir="1" aria-label="Move down">↓</button>
        <button class="icon-btn" data-act="roomDel" data-id="${rm.id}" aria-label="Delete">✕</button></div>`
        )
        .join('')}
      <div class="edit-row"><input type="text" id="room-new" placeholder="Add a room (balcony, car, office…)" data-enter="roomAdd"><button class="icon-btn" data-act="roomAdd">＋</button></div>
      <button class="btn" data-act="sheetDone">Done</button>`;
    });
  A.roomMove = (d) => {
    LW.move(LW.state.routines.rooms, d.id, Number(d.dir));
    LW.refresh();
  };
  A.roomDel = (d) => {
    LW.remove(LW.state.routines.rooms, d.id);
    LW.refresh();
  };
  A.roomAdd = () => {
    const v = (document.getElementById('room-new').value || '').trim();
    if (!v) return;
    LW.state.routines.rooms.push({ id: LW.uid(), name: v });
    LW.sparkle('personal');
    LW.refresh();
    document.getElementById('room-new').focus();
  };

  /* ---------- Run mode ---------- */
  LW.views.run = function (id, q) {
    const r = getR(id);
    if (!r) return `${LW.back('#/routines')}<p class="empty">That routine isn't here any more.</p>`;
    const low = q.low === '1';
    let run = LW.tmp.run;
    if (!run || run.id !== id || run.low !== low) run = LW.tmp.run = { id, low, i: 0, steps: LW.routineSteps(r, low).map((s) => s.id), skipped: 0 };
    const steps = run.steps.map((sid) => LW.byId(r.steps, sid)).filter(Boolean);
    if (!steps.length) return `${LW.back('#/routines')}<p class="empty">This routine has no steps for this season yet.</p><a class="btn" href="#/routine/${r.id}">Add some steps</a>`;
    if (run.i >= steps.length) {
      return `<div class="run-step"><div class="sparkle-big">✦ ✦ ✦</div><h1>${esc(r.name)} done!</h1>
        <p class="sub">${run.skipped ? `You skipped ${run.skipped}, and that's fine. Done is better than perfect.` : LW.c('Every single step. Look at you go.', 'Every bloody step. Absolute legend.')}</p></div>
        <button class="btn" data-act="runFinish">Back to Today</button>`;
    }
    const s = steps[run.i];
    const next = steps[run.i + 1];
    const pct = Math.round((run.i / steps.length) * 100);
    return `<a class="back" href="#/routines" data-act="runExit">‹ Stop for now</a>
      <div class="tiny center">${esc(r.name)}${low ? ' (low-wing)' : ''} · step ${run.i + 1} of ${steps.length}</div>
      <div class="bar" style="margin:8px 0 6px"><b style="width:${pct}%;background:var(--skyM)"></b></div>
      <div class="run-step"><div class="room">${esc(LW.roomName(s.room) || ' ')}</div><div class="what">${esc(s.text)}</div>
      ${s.room && next && next.room === s.room ? '<div class="c s tiny">Get all the bits in this room done, so you\'re not darting around the house.</div>' : ''}
      <div class="sparkle-big">✦</div></div>
      <button class="btn" data-act="runNext">Done, next</button>
      <button class="btn g" data-act="runSkip">Skip this one</button>
      ${run.i > 0 ? '<button class="btn g" data-act="runPrev">Go back one</button>' : ''}
      ${next ? `<div class="tiny center" style="margin-top:10px">Next: ${esc(next.text)}${next.room ? ` (${esc(LW.roomName(next.room))})` : ''}</div>` : ''}`;
  };
  A.runNext = () => {
    LW.tmp.run.i++;
    const r = getR(LW.tmp.run.id);
    if (r && LW.tmp.run.i >= LW.tmp.run.steps.length) {
      LW.sparkle('routine');
      if (LW.tmp.run.low) LW.sparkle('low_wing');
    }
    LW.render();
  };
  A.runSkip = () => {
    LW.tmp.run.skipped++;
    A.runNext();
  };
  A.runPrev = () => {
    LW.tmp.run.i = Math.max(0, LW.tmp.run.i - 1);
    LW.render();
  };
  A.runExit = () => {
    LW.tmp.run = null;
    location.hash = '#/routines';
  };
  A.runFinish = () => {
    LW.tmp.run = null;
    location.hash = '#/today';
  };

  /* ---------- Can I leave the house? ---------- */
  LW.views.leave = function (id) {
    const l = LW.byId(LW.state.leave.lists, id);
    if (!l) return `${LW.back('#/routines')}<p class="empty">That checklist isn't here any more.</p>`;
    if (LW.tmp.leaveEdit === id) {
      return `${LW.back('#/routines', 'Routines')}<h1>Edit checklist</h1>
        <div class="row"><input type="text" value="${esc(l.emoji || '')}" data-bind="leave.lists.#${l.id}.emoji" style="width:56px;text-align:center;font-size:1.3rem" aria-label="Emoji">
        <input type="text" value="${esc(l.name)}" data-bind="leave.lists.#${l.id}.name" aria-label="Checklist name"></div>
        <div class="c" style="margin-top:10px">${l.items
          .map(
            (it) => `<div class="edit-row"><input type="text" value="${esc(it.text)}" data-bind="leave.lists.#${l.id}.items.#${it.id}.text">
          <button class="icon-btn" data-act="leaveItemMove" data-l="${l.id}" data-id="${it.id}" data-dir="-1" aria-label="Move up">↑</button>
          <button class="icon-btn" data-act="leaveItemDel" data-l="${l.id}" data-id="${it.id}" aria-label="Remove">✕</button></div>`
          )
          .join('')}
        <div class="edit-row"><input type="text" id="leave-new" placeholder="Add an essential…" data-enter="leaveItemAdd" data-l="${l.id}"><button class="icon-btn" data-act="leaveItemAdd" data-l="${l.id}">＋</button></div></div>
        <button class="btn" data-act="leaveEdit" data-id="${l.id}">Done</button>
        <button class="btn danger" data-act="leaveDel" data-id="${l.id}">Delete this checklist</button>`;
    }
    const done = l.items.filter(LW.isDoneToday).length;
    const all = l.items.length && done === l.items.length;
    return `${LW.back('#/routines', 'Routines')}
      <div class="hdr"><h1>${esc(l.emoji || '🎒')} ${esc(l.name)}</h1><button class="icon-btn" data-act="leaveEdit" data-id="${l.id}" aria-label="Edit checklist">✎</button></div>
      <p class="sub">Can I leave the house?</p>
      <div class="bar" style="margin-bottom:10px"><b style="width:${l.items.length ? (done / l.items.length) * 100 : 0}%;background:var(--peachM)"></b></div>
      <div class="c o">${l.items.length ? l.items.map((it) => LW.tick(LW.isDoneToday(it), esc(it.text), 'leaveTick', `data-l="${l.id}" data-id="${it.id}"`)).join('') : '<div class="tiny">Add your essentials with the ✎ button.</div>'}</div>
      ${all ? `<div class="c m fill-m center"><b>${LW.c('All set. Off you go! ✦', 'All set. Go get \'em! ✦')}</b></div>` : ''}
      <button class="btn g" data-act="leaveReset" data-id="${l.id}">Clear ticks</button>`;
  };
  const getL = (id) => LW.byId(LW.state.leave.lists, id);
  A.leaveTick = (d) => {
    const l = getL(d.l);
    const it = LW.byId(l.items, d.id);
    it.doneOn = LW.isDoneToday(it) ? '' : LW.today();
    if (l.items.every(LW.isDoneToday)) LW.sparkle('out_door');
    LW.refresh();
  };
  A.leaveReset = (d) => {
    getL(d.id).items.forEach((it) => (it.doneOn = ''));
    LW.refresh();
  };
  A.leaveEdit = (d) => {
    LW.tmp.leaveEdit = LW.tmp.leaveEdit === d.id ? null : d.id;
    LW.render();
  };
  A.leaveAdd = () => {
    const l = { id: LW.uid(), name: 'New checklist', emoji: '🎒', items: [] };
    LW.state.leave.lists.push(l);
    LW.tmp.leaveEdit = l.id;
    LW.save();
    location.hash = `#/leave/${l.id}`;
  };
  A.leaveDel = (d) => {
    if (!confirm('Delete this checklist?')) return;
    LW.remove(LW.state.leave.lists, d.id);
    LW.tmp.leaveEdit = null;
    LW.save();
    location.hash = '#/routines';
  };
  A.leaveItemAdd = (d) => {
    const v = (document.getElementById('leave-new').value || '').trim();
    if (!v) return;
    getL(d.l).items.push({ id: LW.uid(), text: v, doneOn: '' });
    LW.refresh();
    document.getElementById('leave-new').focus();
  };
  A.leaveItemDel = (d) => {
    LW.remove(getL(d.l).items, d.id);
    LW.refresh();
  };
  A.leaveItemMove = (d) => {
    LW.move(getL(d.l).items, d.id, Number(d.dir));
    LW.refresh();
  };
})();
