/* Composants d'interface partagés : coquille, en-têtes, panneau, frise, semaine, dialogues */
(function () {
  const U = window.UMS, S = U.store, esc = U.esc;
  const UI = (U.ui = {});
  U.nav = { week: 0, day: null };
  const HOUR = 64; // hauteur d'une heure dans la grille (px)

  UI.BASE = { STUDENT: 'etudiant', TEACHER: 'enseignant', ADMIN: 'admin' };
  UI.NAV = {
    STUDENT: [['aujourdhui', 'Aujourd’hui', 'sun'], ['edt', 'Emploi du temps', 'calendar'], ['notes', 'Notes', 'grades'], ['absences', 'Absences', 'userx'], ['notifications', 'Notifications', 'bell']],
    TEACHER: [['aujourdhui', 'Aujourd’hui', 'sun'], ['edt', 'Emploi du temps', 'calendar'], ['notes', 'Notes', 'pen'], ['appel', 'Appel', 'roll']],
    ADMIN: [['apercu', 'Vue d’ensemble', 'overview'], ['edt', 'Emploi du temps', 'calendar'], ['utilisateurs', 'Utilisateurs', 'users'], ['cours', 'Cours', 'book']],
  };
  UI.TABS = { STUDENT: ['aujourdhui', 'edt', 'notes', 'absences'], TEACHER: ['aujourdhui', 'edt', 'notes', 'appel'], ADMIN: ['apercu', 'edt', 'utilisateurs', 'cours'] };
  UI.home = (role) => `#/${UI.BASE[role]}/${UI.NAV[role][0][0]}`;
  UI.wide = window.matchMedia('(min-width: 1600px)');

  /* ---------- Identité ---------- */
  UI.mark = (size) =>
    `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="7" fill="#1F62B3"/><path d="M8.5 25.5V15a7.5 7.5 0 0 1 15 0v10.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M13 25.5v-8.25a3 3 0 0 1 6 0v8.25" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  UI.brand = (href, ar = true) =>
    `<a class="brand" href="${href}" aria-label="Services universitaires, accueil">${UI.mark(34)}<span class="lockup"><span class="lk-fr">Services universitaires</span>${ar ? '<span class="lk-ar" lang="ar" dir="rtl">الخدمات الجامعية</span>' : ''}</span></a>`;
  UI.avatar = (u, cls = '') => `<span class="av ${cls}" aria-hidden="true">${esc(U.initials(u))}</span>`;
  UI.tb = (type) => `<span class="tb tb-${type.toLowerCase()}">${esc(type)}</span>`;
  UI.bd = (kind, text) => `<span class="bd${kind ? ' bd-' + kind : ''}">${esc(text)}</span>`;

  /* ---------- Coquille : barre latérale, rail, barre du haut, onglets ---------- */
  UI.shell = (user, active, content) => {
    const role = user.role, base = UI.BASE[role];
    const unread = role === 'STUDENT' ? S.unreadCount(user.id) : 0;
    const unreadTxt = unread ? `, ${unread} non lue${unread > 1 ? 's' : ''}` : '';
    const side = UI.NAV[role]
      .map(([id, label, icon]) => {
        const isN = id === 'notifications' && unread;
        return `<a href="#/${base}/${id}"${id === active ? ' aria-current="page"' : ''}${isN ? ` aria-label="${esc(label + unreadTxt)}"` : ''}><span class="nav-ic">${U.icon(icon)}${isN ? '<span class="nav-dot"></span>' : ''}</span><span>${esc(label)}</span>${isN ? `<span class="count" aria-hidden="true">${unread}</span>` : ''}</a>`;
      })
      .join('');
    const tabs = UI.TABS[role]
      .map((id) => UI.NAV[role].find((n) => n[0] === id))
      .map(([id, label, icon]) => `<a href="#/${base}/${id}"${id === active ? ' aria-current="page"' : ''}>${U.icon(icon, 22)}<span>${esc(label)}</span></a>`)
      .join('');
    const bell = role === 'STUDENT'
      ? `<a class="ibtn" href="#/${base}/notifications" aria-label="Notifications${unreadTxt}"${active === 'notifications' ? ' aria-current="page"' : ''}>${U.icon('bell', 22)}${unread ? `<span class="count" aria-hidden="true">${unread}</span>` : ''}</a>`
      : '';
    const name = esc(S.fullName(user));
    return `<div class="app">
      <aside class="side">
        ${UI.brand(UI.home(role))}
        <nav class="nav" aria-label="Navigation principale">${side}</nav>
        <div class="side-foot">
          <p class="demo-note">Prototype : vos modifications restent dans ce navigateur.<br><button type="button" class="link" data-act="reset">Réinitialiser les données</button></p>
          <div class="me">${UI.avatar(user, 'av-ink')}<div class="me-t"><b>${name}</b><span>${esc(S.subLabel(user))}</span></div><button type="button" class="ibtn" data-act="logout" aria-label="Se déconnecter" data-tip="Se déconnecter">${U.icon('logout', 19)}</button></div>
          <button type="button" class="me-rail" data-act="account" aria-label="Compte de ${name}">${UI.avatar(user, 'av-ink av-lg')}</button>
        </div>
      </aside>
      <header class="topbar">${UI.brand(UI.home(role), false)}<div class="tb-act">${bell}<button type="button" class="ibtn" data-act="account" aria-label="Compte de ${name}">${UI.avatar(user, 'av-ink av-sm')}</button></div></header>
      <main id="main" class="main" tabindex="-1">${content}</main>
      <nav class="tabbar" style="--n:${UI.TABS[role].length}" aria-label="Navigation principale">${tabs}</nav>
    </div>`;
  };

  UI.account = (user) =>
    UI.dialog({
      title: S.fullName(user),
      sub: `${esc(S.subLabel(user))}<br>${esc(user.email)}`,
      cls: 'dlg-sm',
      body: '<p class="dlg-text">Prototype : vos modifications (notes, appels, séances, comptes) restent dans ce navigateur. Les autres visiteurs ne les voient pas.</p>',
      foot: `<button type="button" class="btn btn-s" data-act="reset">${U.icon('reset', 18)}Réinitialiser les données</button><span class="sp"></span><button type="button" class="btn btn-p" data-act="logout">${U.icon('logout', 18)}Se déconnecter</button>`,
    });

  /* ---------- Blocs de page ---------- */
  UI.head = (title, sub, actions) =>
    `<header class="ph"><div class="ph-t"><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${actions ? `<div class="ph-a">${actions}</div>` : ''}</header>`;
  UI.secHead = (title, n, link) =>
    `<div class="sec-h"><h2>${esc(title)}${n != null ? `<span class="n">${n}</span>` : ''}</h2>${link || ''}</div>`;
  UI.stats = (items, mod) =>
    `<dl class="stats${mod ? ' ' + mod : ''}">${items
      .map((it) => `<div class="stat"><dt>${it.href ? `<a href="${it.href}">${esc(it.label)}</a>` : esc(it.label)}</dt><dd${it.id ? ` id="${it.id}"` : ''}>${it.value}${it.note ? `<small>${esc(it.note)}</small>` : ''}</dd></div>`)
      .join('')}</dl>`;
  UI.notice = (kind, title, body, icon) =>
    `<div class="notice ${kind || ''}">${U.icon(icon || (kind === 'info' ? 'info' : kind === 'ok' ? 'checkCircle' : kind === 'bad' ? 'alert' : 'warn'))}<div class="notice-b">${title ? `<b class="notice-t">${esc(title)}</b>` : ''}${body || ''}</div></div>`;
  UI.empty = (icon, title, text, action) =>
    `<div class="empty">${U.icon(icon, 28)}<b>${esc(title)}</b>${text ? `<span>${text}</span>` : ''}${action || ''}</div>`;
  UI.seg = (name, options, value, o = {}) =>
    `<div class="seg${o.full ? ' full' : ''}" role="radiogroup"${o.labelledby ? ` aria-labelledby="${o.labelledby}"` : ` aria-label="${esc(o.label || '')}"`}>${options
      .map((op) => `<label><input type="radio" name="${name}" value="${esc(op.v)}"${op.v === value ? ' checked' : ''}><span>${op.dot ? `<i class="dot ${op.dot}" aria-hidden="true"></i>` : ''}${esc(op.l)}${op.n != null ? `<span class="n">${op.n}</span>` : ''}${op.sr ? `<span class="sr">${esc(op.sr)}</span>` : ''}</span></label>`)
      .join('')}</div>`;
  UI.field = (o) =>
    `<div class="field" data-field="${o.key || o.id}"><label class="label" for="${o.id}">${esc(o.label)}${o.opt ? ' <span class="opt">(facultatif)</span>' : ''}</label>${o.input}${o.hint ? `<p class="hint">${o.hint}</p>` : ''}<p class="f-err" id="${o.id}-err" hidden></p></div>`;
  // Affiche une erreur sous le champ concerné (et retire les précédentes)
  UI.setErr = (root, key, msg) => {
    root.querySelectorAll('.field.err').forEach((f) => {
      f.classList.remove('err');
      const e = f.querySelector(':scope > .f-err');
      if (e) { e.hidden = true; e.innerHTML = ''; }
      f.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
    });
    if (!key) return false;
    const f = root.querySelector(`[data-field="${key}"]`);
    if (!f) return false;
    f.classList.add('err');
    const e = f.querySelector(':scope > .f-err');
    if (e) { e.innerHTML = U.icon('alert', 16) + `<span>${esc(msg)}</span>`; e.hidden = false; }
    const inp = f.querySelector('input:not([type=radio]),select') || f.querySelector('input');
    if (inp) { inp.setAttribute('aria-invalid', 'true'); if (e && e.id) inp.setAttribute('aria-describedby', e.id); inp.focus(); }
    return true;
  };

  /* ---------- Panneau « Prochaine séance » ---------- */
  UI.focusSession = (user) => {
    const t = U.today(), iso = U.iso(t), nowM = U.nowMin();
    const today = S.sessionsFor(user, iso, iso).filter((s) => !s.cancelled);
    const cur = today.find((s) => U.min(s.start) <= nowM && nowM < U.min(s.end));
    if (cur) return { s: cur, live: true };
    const next = S.sessionsFor(user, iso, U.iso(U.addDays(t, 14))).filter((s) => !s.cancelled && (s.date > iso || U.min(s.start) > nowM))[0];
    return next ? { s: next, live: false } : null;
  };
  UI.sign = (f, o = {}) => {
    if (!f) return `<section class="sign quiet" aria-label="Prochaine séance"><div class="sign-top"><span class="sign-k">Prochaine séance</span></div><p style="margin-top:6px;font-size:16px">Aucune séance prévue dans les deux prochaines semaines.</p></section>`;
    const s = f.s, c = S.course(s.courseId), t = S.user(c.teacherId);
    const when = f.live ? `En cours, fin à ${s.end}` : U.cap(U.relSession(s.date, s.start));
    const day = s.date === U.iso(U.today()) ? '' : `${U.cap(U.fmtLong(U.parse(s.date)))}. `;
    const until = f.live ? '' : `, jusqu’à ${s.end}`;
    const who = o.mode === 'teacher' ? `Groupe ${s.group}${until}` : `Avec ${S.teacherLabel(t)}${until}`;
    const k = f.live ? 'Séance en cours' : 'Prochaine séance';
    return `<section class="sign" aria-label="${k}">
      <div class="sign-top"><span class="sign-k">${k}</span><span class="sign-when${f.live ? ' live' : ''}">${esc(when)}</span></div>
      <div class="sign-cell"><span class="sign-l">Heure</span><span class="sign-v">${s.start}</span></div>
      <div class="sign-cell"><span class="sign-l">Salle</span><span class="sign-v">${esc(s.room)}</span></div>
      <div class="sign-info"><div class="sign-c">${esc(c.name)} ${UI.tb(s.type)}</div><div class="sign-sub">${esc(day + who)}</div>${o.actions ? `<div class="sign-act">${o.actions}</div>` : ''}</div>
    </section>`;
  };

  /* ---------- Frise du jour ---------- */
  UI.timeline = (list, o = {}) => {
    const iso = U.iso(U.today()), nowM = U.nowMin();
    let html = '', prevEnd = null;
    list.forEach((s) => {
      const st = U.min(s.start), en = U.min(s.end);
      if (prevEnd != null && !s.cancelled && st - prevEnd >= 30) html += `<li class="tl-pause"><span></span><span class="tl-rail"></span><span class="tl-p">Pause de ${U.dur(st - prevEnd)}</span></li>`;
      const state = s.cancelled ? 'cancel' : s.date < iso || (s.date === iso && en <= nowM) ? 'done' : s.date === iso && st <= nowM ? 'now' : 'next';
      const stTxt = state === 'cancel' ? 'Annulée' : state === 'done' ? 'Terminée' : state === 'now' ? `En cours, fin à ${s.end}` : U.cap(U.relSession(s.date, s.start));
      const c = S.course(s.courseId), t = S.user(c.teacherId);
      const second = o.mode === 'teacher' ? [U.icon('group'), `Groupe ${s.group}`] : [U.icon('user'), S.teacherLabel(t)];
      html += `<li class="tl-item is-${state}"><div class="tl-time"><b>${s.start}</b><span>${s.end}</span></div><span class="tl-rail"><span class="tl-dot"></span></span>
        <div class="tl-body"><div class="tl-title">${esc(c.name)} ${UI.tb(s.type)}${s.modified && !s.cancelled ? UI.bd('warn', 'Modifiée') : ''}</div>
        <div class="meta"><span>${U.icon('pin')}<span class="sr">Salle </span>${esc(s.room)}</span><span>${second[0]}${esc(second[1])}</span></div>${o.extra ? o.extra(s, state) : ''}</div>
        <div class="tl-state">${esc(stTxt)}</div></li>`;
      if (!s.cancelled) prevEnd = Math.max(prevEnd || 0, en);
    });
    return `<ol class="tl">${html}</ol>`;
  };

  /* ---------- Semaine : grille à l'échelle du temps + agenda ---------- */
  UI.weekStart = () => U.addDays(U.weekBase(), 7 * U.nav.week);
  UI.weekRange = (mon) => [U.iso(mon), U.iso(U.addDays(mon, 5))];
  UI.weekSub = (mon) => `Semaine ${U.isoWeek(mon)}, ${U.weekRangeText(mon)}`;
  UI.weekNav = () =>
    `<button type="button" class="ibtn ibtn-b" data-week="-1" aria-label="Semaine précédente" data-tip="Semaine précédente">${U.icon('chevL', 18)}</button><button type="button" class="btn btn-s btn-sm" data-week="0"${U.nav.week === 0 ? ' aria-current="true"' : ''}>Cette semaine</button><button type="button" class="ibtn ibtn-b" data-week="1" aria-label="Semaine suivante" data-tip="Semaine suivante" data-tip-pos="end">${U.icon('chevR', 18)}</button>`;
  UI.weekOffsetOf = (iso) => Math.round((U.monday(U.parse(iso)) - U.weekBase()) / (7 * 86400e3));

  function lanes(list) {
    const res = new Map();
    let cluster = [], end = -1;
    const flush = () => {
      const cols = [];
      cluster.forEach((s) => {
        let i = cols.findIndex((e) => e <= U.min(s.start));
        if (i < 0) { i = cols.length; cols.push(0); }
        cols[i] = U.min(s.end);
        res.set(s.id, { lane: i });
      });
      cluster.forEach((s) => (res.get(s.id).lanes = cols.length));
      cluster = [];
      end = -1;
    };
    list.forEach((s) => {
      if (cluster.length && U.min(s.start) >= end) flush();
      cluster.push(s);
      end = Math.max(end, U.min(s.end));
    });
    flush();
    return res;
  }

  // Bloc d'une séance. pos = position dans la grille, ou { static: true } pour l'agenda
  UI.ev = (s, o, pos) => {
    const c = S.course(s.courseId), t = S.user(c.teacherId);
    const stat = !pos || pos.static;
    const cls = ['ev', 'ev-' + s.type.toLowerCase()];
    if (pos && pos.past) cls.push('is-past');
    if (s.cancelled) cls.push('is-cancelled');
    if (o.selectedId === s.id) cls.push('is-sel');
    if (o.flashId === s.id) cls.push('is-flash');
    if (stat) cls.push('ev-static');
    const second = o.mode === 'teacher' ? `Groupe ${s.group}` : S.teacherLabel(t);
    const flag = s.cancelled ? '<span class="ev-flag is-x">Annulée</span>' : s.modified ? '<span class="ev-flag">Modifiée</span>' : '';
    const label = `${c.name}, ${s.type}, salle ${s.room}, ${U.fmtLong(U.parse(s.date))} de ${s.start} à ${s.end}${s.cancelled ? ', annulée' : s.modified ? ', modifiée' : ''}`;
    const tip = s.modified && s.prev && !s.cancelled ? ` title="${esc(`Avant le changement : ${U.fmtLong(U.parse(s.prev.date))}, ${s.prev.start}–${s.prev.end}, ${s.prev.room}`)}"` : '';
    const style = stat ? '' : ` style="--top:${pos.top}px;--h:${pos.h}px;--lane:${pos.lane};--lanes:${pos.lanes}"`;
    const inner = `<span class="ev-t">${esc(c.name)}</span><span class="ev-m">${UI.tb(s.type)}<span class="ev-room">${esc(s.room)}</span></span><span class="ev-s">${esc(second)}</span>${flag}`;
    const href = o.href && o.href(s);
    if (href) return `<a class="${cls.join(' ')}" href="${esc(href)}" aria-label="${esc(label + (o.hrefLabel ? '. ' + o.hrefLabel : ''))}"${tip}${style}>${inner}</a>`;
    if (o.select) return `<button type="button" class="${cls.join(' ')}" data-sel="${esc(s.id)}" aria-label="${esc('Modifier : ' + label)}" aria-pressed="${o.selectedId === s.id}"${tip}${style}>${inner}</button>`;
    return `<div class="${cls.join(' ')}"${tip}${style}><span class="sr">${esc(s.start + ' à ' + s.end + '. ')}</span>${inner}</div>`;
  };

  UI.board = (sessions, mon, o = {}) => {
    const days = [0, 1, 2, 3, 4, 5].map((i) => U.addDays(mon, i));
    const todayIso = U.iso(U.today()), nowM = U.nowMin();
    let lo = 8 * 60, hi = 18 * 60;
    sessions.forEach((s) => { lo = Math.min(lo, U.min(s.start)); hi = Math.max(hi, U.min(s.end)); });
    lo = Math.floor(lo / 60) * 60;
    hi = Math.ceil(hi / 60) * 60;
    const ppm = HOUR / 60, H = (hi - lo) * ppm, y = (m) => Math.round((m - lo) * ppm);
    let head = '<div class="wk-head"><div></div>';
    days.forEach((d) => {
      const t = U.iso(d) === todayIso;
      head += `<div class="wk-day${t ? ' is-today' : ''}"><span class="wk-dow">${U.dayShort(d)}</span><span class="wk-n">${d.getDate()}</span>${t ? '<span class="sr">, aujourd’hui</span>' : ''}</div>`;
    });
    head += '</div>';
    let gut = '<div class="wk-gut" aria-hidden="true">';
    for (let m = lo; m < hi; m += 60) gut += `<span class="wk-hr" style="--y:${y(m)}px">${U.hm(m)}</span>`;
    gut += '</div>';
    let cols = '';
    days.forEach((d) => {
      const iso = U.iso(d), isToday = iso === todayIso;
      const list = sessions.filter((s) => s.date === iso).sort((a, b) => a.start.localeCompare(b.start) || Number(a.cancelled) - Number(b.cancelled));
      const ln = lanes(list);
      let inner = '';
      if (lo <= 720 && hi >= 810) inner += `<div class="wk-lunch" style="--top:${y(720)}px;--h:${y(810) - y(720)}px" title="Pause déjeuner"></div>`;
      list.forEach((s) => {
        const p = ln.get(s.id);
        const top = y(U.min(s.start));
        inner += UI.ev(s, o, { top, h: Math.max(24, y(U.min(s.end)) - top - 3), lane: p.lane, lanes: p.lanes, past: iso < todayIso || (isToday && U.min(s.end) <= nowM) });
      });
      if (isToday && nowM >= lo && nowM <= hi) inner += `<div class="wk-now" style="--top:${y(nowM)}px" aria-hidden="true"></div>`;
      if (o.canAdd) inner += '<div class="ghost" aria-hidden="true"></div>';
      cols += `<div class="wk-col${isToday ? ' is-today' : ''}${o.canAdd ? ' can-add' : ''}" data-date="${iso}" role="group" aria-label="${esc(U.cap(U.fmtLong(d)))}">${inner}</div>`;
    });
    return `<div class="wk" style="--hour:${HOUR}px;--H:${H}px" data-lo="${lo}" data-ppm="${ppm}">${head}<div class="wk-body">${gut}${cols}</div></div>`;
  };

  UI.agenda = (sessions, mon, o = {}) => {
    const days = [0, 1, 2, 3, 4, 5].map((i) => U.addDays(mon, i));
    const todayIso = U.iso(U.today()), nowM = U.nowMin();
    let sel = U.nav.day;
    if (sel == null) { const i = days.findIndex((d) => U.iso(d) === todayIso); sel = i >= 0 ? i : 0; }
    const tabs = days
      .map((d, i) => {
        const n = sessions.filter((s) => s.date === U.iso(d) && !s.cancelled).length;
        return `<button type="button" role="tab" class="daytab${U.iso(d) === todayIso ? ' is-today' : ''}" aria-selected="${i === sel}" tabindex="${i === sel ? 0 : -1}" data-day="${i}" aria-label="${esc(U.cap(U.fmtLong(d)))}, ${U.plural(n, 'séance', 'séances')}"><span class="d">${U.dayShort(d)}</span><span class="n">${d.getDate()}</span><span class="c" aria-hidden="true">${'<i></i>'.repeat(Math.min(n, 4))}</span></button>`;
      })
      .join('');
    const d = days[sel], iso = U.iso(d);
    const list = sessions.filter((s) => s.date === iso).sort((a, b) => a.start.localeCompare(b.start));
    let items = '', prevEnd = null;
    list.forEach((s) => {
      if (prevEnd != null && !s.cancelled && U.min(s.start) - prevEnd >= 30) items += `<li class="ag-gap">Pause de ${U.dur(U.min(s.start) - prevEnd)}</li>`;
      const past = iso < todayIso || (iso === todayIso && U.min(s.end) <= nowM);
      items += `<li class="ag-item"><div class="ag-time"><b>${s.start}</b><span>${s.end}</span></div>${UI.ev(s, o, { static: true, past })}</li>`;
      if (!s.cancelled) prevEnd = Math.max(prevEnd || 0, U.min(s.end));
    });
    const count = list.filter((s) => !s.cancelled).length;
    const body = list.length ? `<ol class="ag-list">${items}</ol>` : UI.empty('sun', 'Aucune séance ce jour-là.', '', o.emptyAction ? o.emptyAction(iso) : '');
    return `<div class="agenda"><div class="daytabs" role="tablist" aria-label="Jours de la semaine">${tabs}</div>
      <section role="tabpanel" aria-label="${esc(U.cap(U.fmtLong(d)))}"><div class="ag-h"><h3>${esc(U.cap(U.fmtLong(d)))}</h3><span>${count ? U.plural(count, 'séance', 'séances') : ''}</span></div>${body}</section></div>`;
  };

  UI.week = (sessions, mon, o) => UI.board(sessions, mon, o) + UI.agenda(sessions, mon, o);
  UI.bindWeek = (root) => {
    root.querySelectorAll('[data-week]').forEach((b) =>
      b.addEventListener('click', () => {
        const v = +b.dataset.week;
        U.nav.week = v === 0 ? 0 : U.nav.week + v;
        U.nav.day = null;
        U.app.render({ keepScroll: true });
      })
    );
    const tabs = [...root.querySelectorAll('.daytab')];
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => {
        U.nav.day = +b.dataset.day;
        U.app.render({ keepScroll: true });
        const nb = document.querySelector(`.daytab[data-day="${U.nav.day}"]`);
        if (nb) nb.focus({ preventScroll: true });
      });
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        tabs[(i + (e.key === 'ArrowRight' ? 1 : 5)) % 6].click();
      });
    });
  };

  // La ligne « maintenant » avance toute seule
  setInterval(() => {
    document.querySelectorAll('.wk').forEach((wk) => {
      const lo = +wk.dataset.lo, ppm = +wk.dataset.ppm;
      wk.querySelectorAll('.wk-now').forEach((n) => n.style.setProperty('--top', Math.round((U.nowMin() - lo) * ppm) + 'px'));
    });
  }, 60000);

  /* ---------- Dialogues (fenêtre, tiroir, feuille sur téléphone) ---------- */
  let dlgSeq = 0;
  UI.dialog = (o) => {
    const d = document.createElement('dialog');
    const id = 'dlg' + ++dlgSeq;
    d.className = 'dlg ' + (o.cls || '');
    d.setAttribute('aria-labelledby', id + '-t');
    const tag = o.form ? 'form' : 'div';
    d.innerHTML = `<${tag} class="dlg-in"${o.form ? ' novalidate' : ''}><header class="dlg-h"><div><h2 id="${id}-t">${esc(o.title)}</h2>${o.sub ? `<p>${o.sub}</p>` : ''}</div><button type="button" class="ibtn" data-close aria-label="Fermer">${U.icon('x')}</button></header><div class="dlg-b">${o.body || ''}</div>${o.foot ? `<footer class="dlg-f">${o.foot}</footer>` : ''}</${tag}>`;
    document.body.appendChild(d);
    let closed = false, down = false;
    const finish = () => { if (d.open) d.close(); else d.remove(); };
    const close = (silent) => {
      if (closed) return;
      closed = true;
      if (silent) d.dataset.silent = '1';
      if (U.reduceMotion()) return finish();
      d.classList.add('is-closing');
      setTimeout(finish, 190);
    };
    d.addEventListener('close', () => { d.remove(); if (!d.dataset.silent && o.onClose) o.onClose(); });
    d.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    d.addEventListener('mousedown', (e) => (down = e.target === d));
    d.addEventListener('click', (e) => { if (e.target === d && down) close(); down = false; });
    d.querySelector('[data-close]').addEventListener('click', () => close());
    d.showModal();
    return { el: d, close, q: (s) => d.querySelector(s), qa: (s) => d.querySelectorAll(s) };
  };
  UI.closeAll = () => document.querySelectorAll('dialog.dlg').forEach((d) => { d.dataset.silent = '1'; if (d.open) d.close(); else d.remove(); });
  UI.confirm = (o) =>
    new Promise((resolve) => {
      let yes = false;
      const dl = UI.dialog({
        title: o.title,
        cls: 'dlg-sm',
        body: `<p class="dlg-text">${esc(o.text)}</p>`,
        foot: `<span class="sp"></span><button type="button" class="btn btn-s" data-no>${esc(o.cancel || 'Annuler')}</button><button type="button" class="btn ${o.danger ? 'btn-danger' : 'btn-p'}" data-yes>${esc(o.ok)}</button>`,
        onClose: () => resolve(yes),
      });
      dl.q('[data-no]').addEventListener('click', () => dl.close());
      dl.q('[data-yes]').addEventListener('click', () => { yes = true; dl.close(); });
      setTimeout(() => dl.q('[data-yes]').focus(), 40);
    });
})();
