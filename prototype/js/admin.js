/* Espace administration : Vue d'ensemble, Emploi du temps, Utilisateurs, Cours */
(function () {
  const U = window.UMS, S = U.store, UI = U.ui, esc = U.esc;
  const V = (U.views = U.views || {});
  V.ADMIN = {};
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const ROLE = { STUDENT: 'Étudiant', TEACHER: 'Enseignant', ADMIN: 'Administrateur' };
  const ROLE_BD = { STUDENT: '', TEACHER: 'blue', ADMIN: 'warn' };
  const adm = { group: '3 LSI 2', sel: null, draft: null, flash: null, ovDay: null };

  // Ouvre une séance dans l'éditeur de l'emploi du temps
  const openSession = (id) => {
    const s = S.session(id);
    if (!s) return;
    adm.group = s.group; adm.sel = id; adm.draft = null;
    U.nav.week = UI.weekOffsetOf(s.date); U.nav.day = U.dayIdx(U.parse(s.date));
    if (location.hash === '#/admin/edt') U.app.render(); else location.hash = '#/admin/edt';
  };

  /* =================== Vue d'ensemble =================== */
  V.ADMIN.apercu = {
    title: 'Vue d’ensemble',
    render() {
      const t = U.today(), mon = U.weekBase();
      const [a, b] = UI.weekRange(mon);
      const week = S.sessionsFor(null, a, b);
      const days = [0, 1, 2, 3, 4, 5].map((i) => U.addDays(mon, i));
      if (adm.ovDay == null) adm.ovDay = Math.min(U.dayIdx(t), 5);
      const day = days[adm.ovDay], iso = U.iso(day);
      const daySessions = week.filter((s) => s.date === iso && !s.cancelled);
      // Colonnes : les créneaux habituels, plus les horaires atypiques du jour
      const cols = S.SLOTS.map(([s, e]) => ({ s, e }));
      daySessions.forEach((x) => { if (!cols.some((c) => x.start < c.e && c.s < x.end)) cols.push({ s: x.start, e: x.end }); });
      cols.sort((p, q) => p.s.localeCompare(q.s));
      const rooms = S.roomsAll();
      const body = rooms
        .map((r) => `<tr><th scope="row">${esc(r)}</th>${cols
          .map((c) => {
            const x = daySessions.find((s) => s.room.toLowerCase() === r.toLowerCase() && s.start < c.e && c.s < s.end);
            if (!x) return '<td><span class="occ-free">Libre</span></td>';
            const co = S.course(x.courseId);
            return `<td><button type="button" class="occ-slot ev-${x.type.toLowerCase()}" data-open="${esc(x.id)}" aria-label="${esc(`${r}, ${x.start} à ${x.end} : ${co.name}, ${x.type}, ${x.group}. Ouvrir dans l’emploi du temps`)}"><b>${esc(co.name)}</b><span>${UI.tb(x.type)}${esc(U.nb(x.group))}${x.start !== c.s || x.end !== c.e ? `, ${x.start}–${x.end}` : ''}</span></button></td>`;
          })
          .join('')}</tr>`)
        .join('');
      const changes = S.changesBetween(a, b);
      const active = week.filter((s) => !s.cancelled).length;
      const free = rooms.length * cols.length - daySessions.length;
      return `<div class="page wide">
        ${UI.head('Vue d’ensemble', `${esc(U.cap(U.fmtLongY(t)))}. ${esc(UI.weekSub(mon))}.`, `<a class="btn btn-p" href="#/admin/edt" data-new-session>${U.icon('plus', 18)}Nouvelle séance</a>`)}
        ${UI.stats([
          { label: 'Étudiants', value: S.countRole('STUDENT'), href: '#/admin/utilisateurs' },
          { label: 'Enseignants', value: S.countRole('TEACHER'), href: '#/admin/utilisateurs' },
          { label: 'Cours', value: S.courses().length, href: '#/admin/cours' },
          { label: 'Séances cette semaine', value: active, note: changes.length ? `dont ${changes.length} changée${changes.length > 1 ? 's' : ''}` : '' },
          { label: 'Absences non justifiées', value: S.unjustifiedCount() },
        ])}
        <section class="sec" aria-labelledby="h-occ">
          <div class="sec-h"><h2 id="h-occ">Occupation des salles</h2><span class="hint">${U.plural(Math.max(0, free), 'créneau libre', 'créneaux libres')} ce jour-là</span></div>
          <div class="toolbar seg-days">${UI.seg('ovday', days.map((d, i) => ({ v: String(i), l: `${U.dayShort(d)} ${d.getDate()}` })), String(adm.ovDay), { label: 'Jour affiché' })}</div>
          <div class="occ-wrap"><table class="occ"><thead><tr><th scope="col"><span class="sr">Salle</span></th>${cols.map((c) => `<th scope="col">${c.s}–${c.e}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>
          <p class="hint" style="margin-top:10px">Sélectionnez une séance pour l’ouvrir dans l’emploi du temps.</p>
        </section>
        <section class="sec" aria-labelledby="h-chg">
          ${UI.secHead('Changements de la semaine', changes.length)}
          ${changes.length
            ? `<ul class="rows">${changes.map((s) => `<li><button type="button" class="row" data-open="${esc(s.id)}"><span class="nf-ic t">${U.icon(s.cancelled ? 'calX' : 'calMove')}</span><span class="row-main"><span class="row-t">${esc(S.course(s.courseId).name)} ${UI.tb(s.type)}<span class="muted" style="font-weight:400">${esc(s.group)}</span></span><span class="row-s" style="display:block">${esc(s.cancelled ? `Annulée : ${U.fmtLong(U.parse(s.date))}, ${s.start}–${s.end}, salle ${s.room}.` : S.changeText(s))}</span></span>${U.icon('chevR', 18)}</button></li>`).join('')}</ul>`
            : UI.empty('checkCircle', 'Aucun changement cette semaine.', 'Les séances déplacées ou annulées apparaîtront ici.')}
        </section></div>`;
    },
    bind(root) {
      root.querySelectorAll('input[name="ovday"]').forEach((r) => r.addEventListener('change', () => { adm.ovDay = +r.value; U.app.render({ keepScroll: true }); }));
      root.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openSession(b.dataset.open)));
      const nb = root.querySelector('[data-new-session]');
      if (nb) nb.addEventListener('click', (e) => { e.preventDefault(); adm.sel = 'new'; adm.draft = null; location.hash = '#/admin/edt'; });
    },
  };

  /* =================== Emploi du temps =================== */
  function defaultDraft(date, start, end) {
    const t = U.today();
    const d = date || U.iso(U.dayIdx(t) === 6 ? U.addDays(t, 1) : t);
    const c = S.courses().find((x) => x.group === adm.group);
    return { id: null, courseId: c ? c.id : '', type: 'Cours', date: d, start: start || '08:30', end: end || '10:00', room: '' };
  }
  function editorValues() {
    if (adm.sel === 'new') return adm.draft || defaultDraft();
    const s = S.session(adm.sel);
    return s ? Object.assign({}, s) : null;
  }
  function editorParts(v) {
    const editing = !!v.id;
    const s = editing ? S.session(v.id) : null;
    const courses = S.courses().filter((c) => c.group === adm.group);
    const course = S.course(v.courseId) || courses[0];
    const teacher = course ? S.user(course.teacherId) : null;
    const title = editing ? 'Modifier la séance' : 'Nouvelle séance';
    const sub = editing ? `${esc(course.name)}, groupe ${esc(course.group)}` : `Groupe ${esc(adm.group)}`;
    if (s && s.cancelled) {
      return { title, sub, body: `${UI.notice('', 'Séance annulée', `<p>${esc(`${course.name}, ${s.type}, ${U.fmtLong(U.parse(s.date))} de ${s.start} à ${s.end}, salle ${s.room}.`)} Les étudiants ont été prévenus.</p>`)}`, foot: '<span class="sp"></span><button type="button" class="btn btn-s" data-close-ed>Fermer</button>' };
    }
    const slotChips = S.SLOTS.map(([a, b]) => `<button type="button" class="chip" data-slot="${a}|${b}" aria-pressed="${v.start === a && v.end === b}">${a}–${b}</button>`).join('');
    const body = `<div class="form">
      ${UI.field({ id: 'f-course', key: 'course', label: 'Cours', input: `<select id="f-course" class="select"${editing ? ' disabled' : ''}>${courses.map((c) => `<option value="${c.id}"${c.id === (course && course.id) ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`, hint: editing ? 'Pour changer de cours, annulez cette séance et créez-en une nouvelle.' : '' })}
      <div class="ed-teacher" id="f-teacher">${teacher ? UI.avatar(teacher, 'av-sm') + `<span>Enseignant</span><b>${esc(S.fullName(teacher))}</b>` : ''}</div>
      <div class="field" data-field="type"><span class="label" id="f-type-l">Type</span>${UI.seg('f-type', S.TYPES.map((x) => ({ v: x, l: x })), v.type, { full: true, labelledby: 'f-type-l' })}<p class="f-err" id="f-type-err" hidden></p></div>
      ${UI.field({ id: 'f-date', key: 'date', label: 'Date', input: `<input id="f-date" type="date" class="input" value="${esc(v.date)}" required>` })}
      <div class="field" data-field="time"><span class="label">Créneau</span><div class="chips" role="group" aria-label="Créneaux habituels">${slotChips}</div>
        <div class="grid2" style="margin-top:6px"><div class="field"><label class="label" for="f-start">Début</label><input id="f-start" type="time" class="input" step="300" value="${esc(v.start)}" required></div><div class="field"><label class="label" for="f-end">Fin</label><input id="f-end" type="time" class="input" step="300" value="${esc(v.end)}" required></div></div><p class="f-err" id="f-time-err" hidden></p></div>
      <div class="field" data-field="room"><label class="label" for="f-room">Salle</label><input id="f-room" class="input" list="rooms-list" autocomplete="off" value="${esc(v.room)}" placeholder="Par exemple B14" required><datalist id="rooms-list">${S.roomsAll().map((r) => `<option value="${esc(r)}">`).join('')}</datalist><div class="chips" id="f-free" aria-live="polite" style="margin-top:4px"></div><p class="f-err" id="f-room-err" hidden></p></div>
      <div id="f-preview" aria-live="polite"></div></div>`;
    const foot = `${editing ? '<button type="button" class="btn btn-d" id="f-cancel">Annuler la séance</button>' : ''}<span class="sp"></span><button type="button" class="btn btn-s" data-close-ed>Fermer</button><button type="submit" class="btn btn-p" id="f-save">${editing ? 'Enregistrer' : 'Créer la séance'}</button>`;
    return { title, sub, body, foot };
  }
  const closeEditor = () => { adm.sel = null; adm.draft = null; U.app.render({ keepScroll: true }); };

  function bindEditor(form, dl) {
    const q = (s) => form.querySelector(s);
    const v0 = editorValues();
    const closeBtns = form.querySelectorAll('[data-close-ed]');
    const close = () => { if (dl) dl.close(); else closeEditor(); };
    closeBtns.forEach((b) => b.addEventListener('click', close));
    const head = form.querySelector('[data-close]');
    if (head && !dl) head.addEventListener('click', closeEditor);
    if (!q('#f-date')) return; // séance annulée : lecture seule
    const collect = () => ({ id: v0.id || null, courseId: q('#f-course').value, type: (form.querySelector('input[name="f-type"]:checked') || {}).value, date: q('#f-date').value, start: q('#f-start').value, end: q('#f-end').value, room: q('#f-room').value.trim() });
    const save = q('#f-save');
    const freeBox = q('#f-free');
    // Les puces ne prennent pas le focus : le champ en cours de saisie reste actif
    form.addEventListener('mousedown', (e) => { if (e.target.closest('[data-room],[data-slot]')) e.preventDefault(); });
    function update() {
      const d = collect();
      if (!v0.id) adm.draft = d;
      const c = S.course(d.courseId), tch = c && S.user(c.teacherId);
      q('#f-teacher').innerHTML = tch ? UI.avatar(tch, 'av-sm') + `<span>Enseignant</span><b>${esc(S.fullName(tch))}</b>` : '';
      form.querySelectorAll('[data-slot]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.slot === `${d.start}|${d.end}`)));
      const free = S.freeRooms(d.date, d.start, d.end, d.id);
      const freeHtml = d.date && d.start && d.end && d.start < d.end
        ? free.length
          ? `<span class="hint" style="width:100%">Salles libres sur ce créneau</span>${free.map((r) => `<button type="button" class="chip" data-room="${esc(r)}" aria-pressed="${r.toLowerCase() === d.room.toLowerCase()}">${U.icon('pin', 15)}${esc(r)}</button>`).join('')}`
          : '<span class="hint">Aucune salle n’est libre sur ce créneau.</span>'
        : '';
      // Ne remplace les puces que si elles changent (un clic en cours ne doit pas être perdu)
      if (freeBox._h !== freeHtml) { freeBox.innerHTML = freeHtml; freeBox._h = freeHtml; }
      const p = S.previewSession(d);
      const box = q('#f-preview');
      if (!p.ok) {
        const conflict = p.title !== 'Saisie à corriger';
        box.innerHTML = conflict ? UI.notice('bad', p.title, `<p>${esc(p.error)}</p>`) : `<p class="hint">${esc(p.error)}</p>`;
        save.disabled = conflict;
      } else if (p.unchanged) {
        box.innerHTML = '<p class="hint">Aucune modification pour l’instant.</p>';
        save.disabled = true;
      } else {
        box.innerHTML = `<div class="preview"><b>${U.plural(p.recipients, 'étudiant recevra', 'étudiants recevront')} ce message</b><q>${esc(p.message)}</q></div>`;
        save.disabled = false;
      }
      UI.setErr(form, null);
    }
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('click', (e) => {
      const sl = e.target.closest('[data-slot]');
      if (sl) { const [a, b] = sl.dataset.slot.split('|'); q('#f-start').value = a; q('#f-end').value = b; update(); }
      const rm = e.target.closest('[data-room]');
      if (rm) { q('#f-room').value = rm.dataset.room; update(); }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = collect();
      const r = S.saveSession(d);
      if (!r.ok) { UI.setErr(form, r.field || 'room', r.error); return; }
      if (r.unchanged) { close(); return; }
      adm.flash = r.session.id; adm.sel = null; adm.draft = null;
      U.nav.week = UI.weekOffsetOf(r.session.date); U.nav.day = U.dayIdx(U.parse(r.session.date));
      if (dl) dl.close(true);
      U.toast(`${r.created ? 'Séance créée' : 'Séance modifiée'}. ${U.plural(r.notified, 'étudiant notifié', 'étudiants notifiés')}.`);
      U.app.render({ keepScroll: true });
    });
    const cancel = q('#f-cancel');
    if (cancel) cancel.addEventListener('click', async () => {
      const s = S.session(v0.id), c = S.course(s.courseId);
      const yes = await UI.confirm({ title: 'Annuler cette séance ?', text: `${c.name}, ${s.type} du ${U.fmtLong(U.parse(s.date))} de ${s.start} à ${s.end}. Les ${S.studentsOfCourse(c.id).length} étudiants inscrits seront prévenus.`, ok: 'Annuler la séance', cancel: 'Garder la séance', danger: true });
      if (!yes) return;
      const n = S.cancelSession(s.id);
      adm.flash = s.id; adm.sel = null;
      if (dl) dl.close(true);
      U.toast(`Séance annulée. ${U.plural(n, 'étudiant notifié', 'étudiants notifiés')}.`);
      U.app.render({ keepScroll: true });
    });
    update();
  }

  V.ADMIN.edt = {
    title: 'Emploi du temps',
    render() {
      const mon = UI.weekStart();
      const [a, b] = UI.weekRange(mon);
      const ss = S.sessionsFor(null, a, b, adm.group);
      if (adm.sel && adm.sel !== 'new' && !S.session(adm.sel)) adm.sel = null;
      const docked = UI.wide.matches && adm.sel;
      let aside = '';
      if (docked) {
        const p = editorParts(editorValues());
        aside = `<aside class="editor" aria-label="${p.title}"><form class="dlg-in" id="ed-form" novalidate><header class="dlg-h"><div><h2>${p.title}</h2><p>${p.sub}</p></div><button type="button" class="ibtn" data-close aria-label="Fermer">${U.icon('x')}</button></header><div class="dlg-b">${p.body}</div><footer class="dlg-f">${p.foot}</footer></form></aside>`;
      }
      const groups = S.GROUPS.map((g) => ({ v: g, l: g, n: S.sessionsFor(null, a, b, g).filter((s) => !s.cancelled).length }));
      return `<div class="page wide">
        ${UI.head('Emploi du temps', `${esc(UI.weekSub(mon))}. Cliquez sur une séance pour la modifier, ou sur un créneau vide pour en créer une.`, `${UI.weekNav()}<button type="button" class="btn btn-p" id="new-s">${U.icon('plus', 18)}Nouvelle séance</button>`)}
        <div class="toolbar"><span class="label" id="grp-l">Groupe</span>${UI.seg('grp', groups, adm.group, { labelledby: 'grp-l' })}</div>
        <div class="edt-layout${docked ? ' has-editor' : ''}"><div style="min-width:0">${UI.week(ss, mon, { mode: 'admin', select: true, selectedId: adm.sel, flashId: adm.flash, canAdd: true, emptyAction: (iso) => `<button type="button" class="btn btn-s btn-sm" data-add-day="${iso}">${U.icon('plus', 18)}Ajouter une séance ce jour-là</button>` })}</div>${aside}</div>
      </div>`;
    },
    bind(root) {
      UI.bindWeek(root);
      const rerender = () => U.app.render({ keepScroll: true });
      adm.flash = null;
      root.querySelectorAll('input[name="grp"]').forEach((r) => r.addEventListener('change', () => { adm.group = r.value; adm.sel = null; adm.draft = null; rerender(); }));
      const startNew = (date, start, end) => { adm.sel = 'new'; adm.draft = defaultDraft(date, start, end); rerender(); };
      root.querySelector('#new-s').addEventListener('click', () => startNew(U.iso(U.addDays(UI.weekStart(), Math.min(U.nav.day != null ? U.nav.day : Math.min(U.dayIdx(U.today()), 5), 5)))));
      root.querySelectorAll('[data-add-day]').forEach((b) => b.addEventListener('click', () => startNew(b.dataset.addDay)));
      root.querySelectorAll('[data-sel]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); adm.sel = b.dataset.sel; adm.draft = null; rerender(); }));

      // Créer en cliquant sur un créneau vide (aperçu en pointillés au survol)
      const wk = root.querySelector('.wk');
      if (wk) {
        const lo = +wk.dataset.lo, ppm = +wk.dataset.ppm;
        const slotAt = (col, clientY) => {
          const m = lo + (clientY - col.getBoundingClientRect().top) / ppm;
          const std = S.SLOTS.find(([a, b]) => m >= U.min(a) && m < U.min(b));
          if (std) return { s: std[0], e: std[1] };
          const st = Math.max(lo, Math.floor(m / 15) * 15);
          return { s: U.hm(st), e: U.hm(Math.min(st + 90, 23 * 60 + 55)) };
        };
        const busy = (col, sl) => [...col.querySelectorAll('.ev:not(.is-cancelled)')].some((ev) => { const top = parseFloat(ev.style.getPropertyValue('--top')), h = parseFloat(ev.style.getPropertyValue('--h')); const a = lo + top / ppm, b = a + (h + 3) / ppm; return U.min(sl.s) < b && a < U.min(sl.e); });
        wk.querySelectorAll('.wk-col.can-add').forEach((col) => {
          const ghost = col.querySelector('.ghost');
          col.addEventListener('mousemove', (e) => {
            if (e.target.closest('.ev')) { ghost.classList.remove('on'); return; }
            const sl = slotAt(col, e.clientY);
            if (busy(col, sl)) { ghost.classList.remove('on'); return; }
            ghost.style.setProperty('--top', Math.round((U.min(sl.s) - lo) * ppm) + 'px');
            ghost.style.setProperty('--h', Math.round((U.min(sl.e) - U.min(sl.s)) * ppm) - 3 + 'px');
            ghost.innerHTML = `${U.icon('plus', 15)}${sl.s}–${sl.e}`;
            ghost.classList.add('on');
          });
          col.addEventListener('mouseleave', () => ghost.classList.remove('on'));
          col.addEventListener('click', (e) => {
            if (e.target.closest('.ev')) return;
            const sl = slotAt(col, e.clientY);
            if (busy(col, sl)) return;
            startNew(col.dataset.date, sl.s, sl.e);
          });
        });
      }

      if (!adm.sel) return;
      if (UI.wide.matches) {
        const form = root.querySelector('#ed-form');
        if (form) bindEditor(form, null);
        return;
      }
      const p = editorParts(editorValues());
      const dl = UI.dialog({ title: p.title, sub: p.sub, body: p.body, foot: p.foot, form: true, cls: 'dlg-drawer', onClose: closeEditor });
      bindEditor(dl.el.querySelector('form'), dl);
    },
  };

  /* =================== Utilisateurs =================== */
  const um = { role: 'ALL', q: '' };
  function userRows() {
    const q = norm(um.q.trim());
    const list = S.users().filter((u) => (um.role === 'ALL' || u.role === um.role) && (!q || norm(S.fullName(u) + ' ' + u.email).includes(q))).sort(S.byName);
    if (!list.length) return `<tr><td colspan="5">${UI.empty('search', `Aucun compte ne correspond à « ${esc(um.q.trim())} ».`, '', '<button type="button" class="btn btn-s btn-sm" data-clear>Effacer la recherche</button>')}</td></tr>`;
    return list
      .map((u) => `<tr>
        <td><div class="who">${UI.avatar(u)}<div style="min-width:0"><b>${esc(S.fullName(u))}</b><span>${esc(u.email)}</span></div></div></td>
        <td class="m-sub">${UI.bd(ROLE_BD[u.role], ROLE[u.role])}<span class="m-only">${u.group ? ' ' + esc(u.group) : ''}</span></td>
        <td class="m-hide">${u.group ? esc(u.group) : '<span class="muted">—</span>'}</td>
        <td class="m-hide num">${esc(U.fmtShortY(U.parse(u.createdAt)))}</td>
        <td class="r m-end"><button type="button" class="btn btn-g btn-sm" data-edit="${esc(u.id)}" aria-label="Modifier le compte de ${esc(S.fullName(u))}">${U.icon('edit', 17)}<span class="m-hide-txt">Modifier</span></button></td></tr>`)
      .join('');
  }
  function userForm(u) {
    const editing = !!u;
    const v = u || { firstName: '', lastName: '', email: '', role: 'STUDENT', group: '3 LSI 2' };
    return `<div class="form">
      <div class="grid2">${UI.field({ id: 'u-first', key: 'firstName', label: 'Prénom', input: `<input id="u-first" class="input" autocomplete="off" value="${esc(v.firstName)}">` })}${UI.field({ id: 'u-last', key: 'lastName', label: 'Nom', input: `<input id="u-last" class="input" autocomplete="off" value="${esc(v.lastName)}">` })}</div>
      ${UI.field({ id: 'u-email', key: 'email', label: 'Adresse e-mail', input: `<input id="u-email" class="input" type="email" autocomplete="off" placeholder="prenom.nom@ums.test" value="${esc(v.email)}">`, hint: editing ? '' : 'Elle sert d’identifiant de connexion.' })}
      <div class="grid2">
        ${UI.field({ id: 'u-role', key: 'role', label: 'Rôle', input: `<select id="u-role" class="select">${Object.keys(ROLE).map((r) => `<option value="${r}"${r === v.role ? ' selected' : ''}>${ROLE[r]}</option>`).join('')}</select>` })}
        <div id="u-grow"${v.role === 'STUDENT' ? '' : ' hidden'}>${UI.field({ id: 'u-group', key: 'group', label: 'Groupe', input: `<select id="u-group" class="select">${S.GROUPS.map((g) => `<option${g === (v.group || '3 LSI 2') ? ' selected' : ''}>${esc(g)}</option>`).join('')}</select>` })}</div>
      </div>
      ${UI.field({ id: 'u-pass', key: 'password', label: editing ? 'Nouveau mot de passe' : 'Mot de passe provisoire', opt: editing, input: `<div class="pw"><input id="u-pass" class="input" autocomplete="off" spellcheck="false" placeholder="6 caractères minimum"><button type="button" class="ibtn" id="u-gen" aria-label="Générer un mot de passe" data-tip="Générer">${U.icon('key', 18)}</button></div>`, hint: editing ? 'Laissez vide pour garder le mot de passe actuel.' : 'Communiquez-le à la personne ; elle pourra le changer.' })}
    </div>`;
  }
  function openUserDialog(me, u) {
    const editing = !!u;
    const dl = UI.dialog({
      title: editing ? 'Modifier le compte' : 'Nouveau compte',
      sub: editing ? `${esc(S.fullName(u))}, créé le ${esc(U.fmtShortY(U.parse(u.createdAt)))}` : 'Le rôle décide des écrans et des actions autorisées.',
      body: userForm(u),
      foot: `<span class="sp"></span><button type="button" class="btn btn-s" data-cancel>Annuler</button><button type="submit" class="btn btn-p">${editing ? 'Enregistrer' : 'Créer le compte'}</button>`,
      form: true,
    });
    const q = dl.q;
    const role = q('#u-role');
    if (editing && u.id === me.id) { role.disabled = true; role.closest('.field').insertAdjacentHTML('beforeend', '<p class="hint">Vous ne pouvez pas changer votre propre rôle.</p>'); }
    role.addEventListener('change', () => (q('#u-grow').hidden = role.value !== 'STUDENT'));
    q('#u-gen').addEventListener('click', () => {
      const cs = 'abcdefghjkmnpqrstuvwxyz23456789';
      let p = '';
      const r = new Uint32Array(8);
      (window.crypto || window.msCrypto).getRandomValues(r);
      r.forEach((x) => (p += cs[x % cs.length]));
      q('#u-pass').value = p;
      q('#u-pass').focus();
    });
    q('[data-cancel]').addEventListener('click', () => dl.close());
    dl.el.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = { firstName: q('#u-first').value, lastName: q('#u-last').value, email: q('#u-email').value, role: role.value, group: q('#u-group').value, password: q('#u-pass').value };
      const r = editing ? S.updateUser(u.id, d, me.id) : S.addUser(d);
      if (!r.ok) { UI.setErr(dl.el, r.field, r.error); return; }
      dl.close(true);
      U.toast(editing ? `Compte de ${S.fullName(r.user)} enregistré.` : `Compte créé. ${S.fullName(r.user)} peut se connecter avec ${r.user.email}.`);
      U.app.render({ keepScroll: true });
    });
    setTimeout(() => q('#u-first').focus(), 60);
  }
  V.ADMIN.utilisateurs = {
    title: 'Utilisateurs',
    render() {
      const n = (r) => (r === 'ALL' ? S.users().length : S.countRole(r));
      const roles = [{ v: 'ALL', l: 'Tous', n: n('ALL') }, { v: 'STUDENT', l: 'Étudiants', n: n('STUDENT') }, { v: 'TEACHER', l: 'Enseignants', n: n('TEACHER') }, { v: 'ADMIN', l: 'Administrateurs', n: n('ADMIN') }];
      return `<div class="page">
        ${UI.head('Utilisateurs', 'Chaque compte a un rôle : étudiant, enseignant ou administrateur. Le rôle décide des écrans auxquels la personne accède.', `<button type="button" class="btn btn-p" id="new-u">${U.icon('plus', 18)}Nouveau compte</button>`)}
        <div class="toolbar"><div class="search grow">${U.icon('search')}<label class="sr" for="uq">Rechercher un compte</label><input id="uq" class="input" type="search" placeholder="Rechercher par nom ou adresse e-mail" value="${esc(um.q)}" autocomplete="off"></div>${UI.seg('urole', roles, um.role, { label: 'Filtrer par rôle' })}</div>
        <table class="tbl tbl-list users"><thead><tr><th scope="col">Nom</th><th scope="col">Rôle</th><th scope="col" class="m-hide">Groupe</th><th scope="col" class="m-hide">Créé le</th><th scope="col" class="r"><span class="sr">Actions</span></th></tr></thead><tbody id="ubody">${userRows()}</tbody></table>
      </div>`;
    },
    bind(root, me) {
      const body = root.querySelector('#ubody');
      const bindRows = () => {
        body.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openUserDialog(me, S.user(b.dataset.edit))));
        const c = body.querySelector('[data-clear]');
        if (c) c.addEventListener('click', () => { um.q = ''; root.querySelector('#uq').value = ''; refresh(); root.querySelector('#uq').focus(); });
      };
      const refresh = () => { body.innerHTML = userRows(); bindRows(); };
      root.querySelector('#uq').addEventListener('input', U.debounce((e) => { um.q = e.target.value; refresh(); }, 120));
      root.querySelectorAll('input[name="urole"]').forEach((r) => r.addEventListener('change', () => { um.role = r.value; refresh(); }));
      root.querySelector('#new-u').addEventListener('click', () => openUserDialog(me, null));
      bindRows();
    },
  };

  /* =================== Cours et inscriptions =================== */
  const crs = { sel: null, q: '' };
  function openCourseDialog() {
    const dl = UI.dialog({
      title: 'Nouveau cours',
      sub: 'Les étudiants du groupe choisi sont inscrits automatiquement.',
      body: `<div class="form">
        ${UI.field({ id: 'c-name', key: 'name', label: 'Nom du cours', input: '<input id="c-name" class="input" autocomplete="off" placeholder="Par exemple Sécurité des réseaux">' })}
        <div class="grid2">${UI.field({ id: 'c-group', key: 'group', label: 'Groupe', input: `<select id="c-group" class="select">${S.GROUPS.map((g) => `<option>${esc(g)}</option>`).join('')}</select>` })}
        ${UI.field({ id: 'c-teacher', key: 'teacher', label: 'Enseignant', input: `<select id="c-teacher" class="select">${S.teachers().map((t) => `<option value="${t.id}">${esc(S.fullName(t))}</option>`).join('')}</select>` })}</div></div>`,
      foot: '<span class="sp"></span><button type="button" class="btn btn-s" data-cancel>Annuler</button><button type="submit" class="btn btn-p">Créer le cours</button>',
      form: true,
    });
    dl.q('[data-cancel]').addEventListener('click', () => dl.close());
    dl.el.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const r = S.addCourse({ name: dl.q('#c-name').value, group: dl.q('#c-group').value, teacherId: dl.q('#c-teacher').value });
      if (!r.ok) { UI.setErr(dl.el, r.field, r.error); return; }
      dl.close(true);
      crs.sel = r.course.id;
      U.toast(`Cours « ${r.course.name} » créé pour ${r.course.group}, ${U.plural(S.studentsOfCourse(r.course.id).length, 'étudiant inscrit', 'étudiants inscrits')}.`);
      U.app.render({ keepScroll: true });
    });
    setTimeout(() => dl.q('#c-name').focus(), 60);
  }
  V.ADMIN.cours = {
    title: 'Cours',
    render() {
      const courses = S.courses();
      if (!crs.sel && window.innerWidth >= 900 && courses[0]) crs.sel = courses[0].id;
      const cur = crs.sel && S.course(crs.sel);
      const list = S.GROUPS.map((g) => {
        const cs = courses.filter((c) => c.group === g).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        if (!cs.length) return '';
        return `<div class="cx-group">Groupe ${esc(g)}</div>${cs.map((c) => { const n = S.studentsOfCourse(c.id).length; return `<button type="button" class="cx-item" data-course="${c.id}" aria-current="${cur && cur.id === c.id}"><span style="flex:1;min-width:0"><b>${esc(c.name)}</b><span>${esc(S.fullName(S.user(c.teacherId)))}</span></span><span class="n" data-count="${c.id}" aria-label="${U.plural(n, 'inscrit', 'inscrits')}">${n}</span></button>`; }).join('')}`;
      }).join('');
      let detail = UI.empty('book', 'Choisissez un cours.', 'Vous pourrez inscrire ou désinscrire des étudiants.');
      if (cur) {
        const teacher = S.user(cur.teacherId);
        const students = S.students().sort((a, b) => (a.group === cur.group ? 0 : 1) - (b.group === cur.group ? 0 : 1) || S.byName(a, b));
        const inGroup = students.filter((s) => s.group === cur.group);
        detail = `<button type="button" class="btn btn-g btn-sm cx-back" data-back>${U.icon('back', 18)}Tous les cours</button>
          <h2 class="cx-title">${esc(cur.name)}</h2>
          <div class="meta" style="margin:8px 0 20px"><span>${U.icon('group')}Groupe ${esc(cur.group)}</span><span>${U.icon('user')}${esc(S.fullName(teacher))}</span></div>
          ${UI.stats([{ label: 'Inscrits', value: S.studentsOfCourse(cur.id).length, id: 'cx-n' }, { label: `Étudiants de ${cur.group}`, value: inGroup.length }])}
          <div class="toolbar" style="margin-top:24px"><div class="search grow">${U.icon('search')}<label class="sr" for="cq">Filtrer les étudiants</label><input id="cq" class="input" type="search" placeholder="Filtrer les étudiants" value="${esc(crs.q)}" autocomplete="off"></div><button type="button" class="btn btn-s btn-sm" data-all>Inscrire tout le groupe</button></div>
          <ul class="enrol">${students.map((s) => `<li data-name="${esc(norm(S.fullName(s)))}"><label><input type="checkbox" class="chk" data-st="${s.id}"${S.isEnrolled(s.id, cur.id) ? ' checked' : ''}>${UI.avatar(s, 'av-sm')}<span class="nm">${esc(s.lastName)} ${esc(s.firstName)}</span><span class="gp">${esc(s.group || '')}</span></label></li>`).join('')}</ul>`;
      }
      return `<div class="page wide" style="max-width:1240px">
        ${UI.head('Cours', 'Les étudiants inscrits à un cours voient ses séances, reçoivent ses notifications et figurent sur ses feuilles de notes et d’appel.', `<button type="button" class="btn btn-p" id="new-c">${U.icon('plus', 18)}Nouveau cours</button>`)}
        <div class="cx${cur ? ' has-sel' : ''}"><nav class="cx-list" aria-label="Liste des cours">${list}</nav><section class="cx-detail" aria-live="polite">${detail}</section></div></div>`;
    },
    bind(root) {
      root.querySelector('#new-c').addEventListener('click', openCourseDialog);
      root.querySelectorAll('[data-course]').forEach((b) => b.addEventListener('click', () => { crs.sel = b.dataset.course; crs.q = ''; U.app.render({ keepScroll: window.innerWidth >= 900 }); }));
      const back = root.querySelector('[data-back]');
      if (back) back.addEventListener('click', () => { crs.sel = null; U.app.render(); });
      const cur = crs.sel && S.course(crs.sel);
      if (!cur) return;
      const upd = () => {
        const n = S.studentsOfCourse(cur.id).length;
        const a = root.querySelector('#cx-n'), b = root.querySelector(`[data-count="${cur.id}"]`);
        if (a) a.textContent = n;
        if (b) { b.textContent = n; b.setAttribute('aria-label', U.plural(n, 'inscrit', 'inscrits')); }
      };
      root.querySelectorAll('.enrol [data-st]').forEach((c) => c.addEventListener('change', () => { S.setEnrollment(c.dataset.st, cur.id, c.checked); upd(); }));
      const filter = () => { const q = norm(crs.q.trim()); root.querySelectorAll('.enrol li').forEach((li) => (li.hidden = !!q && !li.dataset.name.includes(q))); };
      root.querySelector('#cq').addEventListener('input', (e) => { crs.q = e.target.value; filter(); });
      filter();
      root.querySelector('[data-all]').addEventListener('click', () => {
        const todo = S.students().filter((s) => s.group === cur.group && !S.isEnrolled(s.id, cur.id));
        todo.forEach((s) => S.setEnrollment(s.id, cur.id, true));
        U.toast(todo.length ? `${U.plural(todo.length, 'étudiant inscrit', 'étudiants inscrits')} à ${cur.name}.` : `Tout le groupe ${cur.group} est déjà inscrit.`);
        U.app.render({ keepScroll: true });
      });
    },
  };
})();
