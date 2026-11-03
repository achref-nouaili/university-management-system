/* Espace étudiant : Aujourd'hui, Emploi du temps, Notes, Absences, Notifications */
(function () {
  const U = window.UMS, S = U.store, UI = U.ui, esc = U.esc;
  const V = (U.views = U.views || {});
  V.STUDENT = {};
  const freshLimit = () => U.iso(U.addDays(U.today(), -3));
  const changeLine = (s) => (s.cancelled ? `Le ${s.type} de ${S.course(s.courseId).name} du ${U.fmtLong(U.parse(s.date))} est annulé.` : S.changeText(s));

  /* ---------- Aujourd'hui ---------- */
  V.STUDENT.aujourdhui = {
    title: 'Aujourd’hui',
    render(user) {
      const t = U.today(), iso = U.iso(t);
      const list = S.sessionsFor(user, iso, iso);
      const f = UI.focusSession(user);
      const changes = S.notificationsOf(user.id).filter((n) => !n.read && (n.type === 'TIMETABLE' || n.type === 'CANCEL'));
      const grades = S.gradesOf(user.id).slice(0, 3);
      const abs = S.absencesOf(user.id);
      const unj = abs.filter((a) => a.status === 'UNJUSTIFIED').length;
      const fresh = freshLimit();
      const notice = changes.length
        ? UI.notice('', changes.length > 1 ? `${changes.length} changements d’emploi du temps` : 'Changement d’emploi du temps', `<ul>${changes.slice(0, 3).map((n) => `<li>${esc(n.body)}</li>`).join('')}</ul><p style="margin-top:6px"><a href="#/etudiant/notifications">Voir les notifications</a></p>`)
        : '';
      const count = list.filter((s) => !s.cancelled).length;
      return `<div class="page">
        ${UI.head('Bonjour ' + user.firstName, esc(U.cap(U.fmtLongY(t))))}
        ${notice ? `<div style="margin-bottom:20px">${notice}</div>` : ''}
        ${UI.sign(f)}
        <div class="dash">
          <div class="col"><section class="sec" aria-labelledby="h-day">
            <div class="sec-h"><h2 id="h-day">Programme du jour<span class="n">${count}</span></h2><a href="#/etudiant/edt">Voir la semaine</a></div>
            ${list.length ? UI.timeline(list) : UI.empty('sun', 'Aucune séance aujourd’hui.', f ? `Prochaine séance : ${esc(S.course(f.s.courseId).name)}, ${esc(U.relSession(f.s.date, f.s.start))}.` : '')}
          </section></div>
          <div class="col">
            <section class="sec" aria-labelledby="h-gr">
              <div class="sec-h"><h2 id="h-gr">Dernières notes</h2><a href="#/etudiant/notes">Toutes les notes</a></div>
              ${grades.length
                ? `<ul class="rows">${grades.map((g) => `<li><a class="row" href="#/etudiant/notes"><span class="row-main"><span class="row-t">${esc(S.course(g.courseId).name)}${g.publicationDate >= fresh ? UI.bd('blue', 'Nouvelle') : ''}</span><span class="row-s" style="display:block">${esc(g.label)}, publiée le ${esc(U.fmtShort(U.parse(g.publicationDate)))}</span></span><span class="row-end"><span class="grade">${U.fmtGrade(g.value)}<small>/20</small></span></span></a></li>`).join('')}</ul>`
                : UI.empty('grades', 'Aucune note publiée pour le moment.')}
            </section>
            <section class="sec" aria-labelledby="h-as">
              <div class="sec-h"><h2 id="h-as">Assiduité</h2><a href="#/etudiant/absences">Voir le détail</a></div>
              ${UI.stats([{ label: 'Absences ce semestre', value: abs.length }, { label: 'Non justifiées', value: unj }])}
            </section>
          </div>
        </div></div>`;
    },
  };

  /* ---------- Emploi du temps ---------- */
  V.STUDENT.edt = {
    title: 'Emploi du temps',
    render(user) {
      const mon = UI.weekStart();
      const [a, b] = UI.weekRange(mon);
      const ss = S.sessionsFor(user, a, b);
      const changes = ss.filter((s) => s.modified || s.cancelled);
      const notice = changes.length
        ? UI.notice('', changes.length > 1 ? `${changes.length} changements cette semaine` : 'Changement cette semaine', `<ul>${changes.map((s) => `<li>${esc(changeLine(s))}</li>`).join('')}</ul>`)
        : '';
      return `<div class="page wide">
        ${UI.head('Emploi du temps', `Groupe ${esc(U.nb(user.group))}. ${esc(UI.weekSub(mon))}.`, UI.weekNav())}
        ${notice ? `<div style="margin-bottom:20px">${notice}</div>` : ''}
        ${UI.week(ss, mon, { mode: 'student' })}</div>`;
    },
    bind(root) { UI.bindWeek(root); },
  };

  /* ---------- Notes ---------- */
  V.STUDENT.notes = {
    title: 'Notes',
    render(user) {
      const grades = S.gradesOf(user.id);
      const fresh = freshLimit();
      const nNew = grades.filter((g) => g.publicationDate >= fresh).length;
      const last = grades[0];
      const rows = grades
        .map((g) => {
          const d = U.parse(g.publicationDate);
          return `<tr>
            <td><span class="row-t">${esc(S.course(g.courseId).name)}${g.publicationDate >= fresh ? UI.bd('blue', 'Nouvelle') : ''}</span></td>
            <td class="m-sub">${esc(g.label)}<span class="m-only">, publiée le ${esc(U.fmtShort(d))}</span></td>
            <td class="r m-end"><span class="grade">${U.fmtGrade(g.value)}<small>/20</small></span></td>
            <td class="m-hide" aria-hidden="true"><span class="bar"><i style="width:${(g.value / 20) * 100}%"></i></span></td>
            <td class="m-hide num">${esc(U.fmtShortY(d))}</td></tr>`;
        })
        .join('');
      return `<div class="page">
        ${UI.head('Notes', 'Semestre 5, année universitaire 2026–2027. Seules les notes publiées par vos enseignants apparaissent ici.')}
        ${UI.stats([{ label: 'Notes publiées', value: grades.length }, { label: 'Nouvelles, 3 derniers jours', value: nNew }, { label: 'Dernière publication', value: last ? esc(U.fmtShort(U.parse(last.publicationDate))) : '—' }])}
        <section class="sec" aria-labelledby="h-n">
          ${UI.secHead('Notes publiées', grades.length)}
          ${grades.length
            ? `<table class="tbl tbl-list"><thead><tr><th scope="col">Matière</th><th scope="col">Évaluation</th><th scope="col" class="r">Note</th><th scope="col"><span class="sr">Position sur 20</span></th><th scope="col">Publiée le</th></tr></thead><tbody>${rows}</tbody></table>
               <p class="hint" style="margin-top:12px">La barre situe chaque note sur 20 ; le repère blanc marque 10/20.</p>`
            : UI.empty('grades', 'Aucune note publiée pour le moment.', 'Vous recevrez une notification dès qu’un enseignant publie une note.')}
        </section></div>`;
    },
  };

  /* ---------- Absences ---------- */
  V.STUDENT.absences = {
    title: 'Absences',
    render(user) {
      const abs = S.absencesOf(user.id);
      const unj = abs.filter((a) => a.status === 'UNJUSTIFIED').length;
      const byMonth = [];
      abs.forEach((a) => {
        const d = U.parse(a.session.date), key = U.monthLabel(d);
        let g = byMonth.find((x) => x.key === key);
        if (!g) byMonth.push((g = { key, items: [] }));
        g.items.push(a);
      });
      const list = byMonth
        .map((g) => `<h3 class="day-h">${esc(g.key)}</h3><ul class="rows">${g.items
          .map((a) => {
            const s = a.session, d = U.parse(s.date), c = S.course(s.courseId);
            return `<li><div class="row"><div class="abs-date"><b>${d.getDate()}</b><span>${U.dayShort(d).toLowerCase()}.</span></div>
              <div class="row-main"><div class="row-t">${esc(c.name)} ${UI.tb(s.type)}</div><div class="row-s">${s.start}–${s.end}, salle ${esc(s.room)}</div></div>
              <div class="row-end">${a.status === 'JUSTIFIED' ? UI.bd('ok', 'Justifiée') : UI.bd('bad', 'Non justifiée')}</div></div></li>`;
          })
          .join('')}</ul>`)
        .join('');
      return `<div class="page" style="max-width:860px">
        ${UI.head('Absences', 'Semestre 5, année universitaire 2026–2027.')}
        ${UI.stats([{ label: 'Absences', value: abs.length }, { label: 'Non justifiées', value: unj }, { label: 'Justifiées', value: abs.length - unj }], 's3')}
        <section class="sec" aria-label="Liste des absences">
          ${abs.length ? list : UI.empty('checkCircle', 'Aucune absence enregistrée.', 'Les absences apparaissent ici après l’appel de l’enseignant.')}
          <p class="hint" style="margin-top:16px">Une absence passe à « Justifiée » quand la scolarité accepte votre justificatif.</p>
        </section></div>`;
    },
  };

  /* ---------- Notifications ---------- */
  const nf = { filter: 'all' };
  const NF_ICON = { TIMETABLE: ['calMove', 't'], CANCEL: ['calX', 't'], GRADE: ['grades', 'g'] };
  V.STUDENT.notifications = {
    title: 'Notifications',
    render(user) {
      const all = S.notificationsOf(user.id);
      const unread = all.filter((n) => !n.read).length;
      const ns = nf.filter === 'unread' ? all.filter((n) => !n.read) : all;
      const today = U.iso(U.today()), yest = U.iso(U.addDays(U.today(), -1));
      const groups = [['Aujourd’hui', []], ['Hier', []], ['Plus tôt', []]];
      ns.forEach((n) => { const d = U.iso(new Date(n.createdAt)); groups[d === today ? 0 : d === yest ? 1 : 2][1].push(n); });
      const item = (n) => {
        const [ic, tone] = NF_ICON[n.type] || ['bell', ''];
        return `<li><button type="button" class="nf${n.read ? '' : ' unread'}" data-n="${esc(n.id)}" data-type="${n.type}"><span class="nf-ic ${tone}">${U.icon(ic)}</span><span class="nf-b"><span class="nf-t">${esc(n.title)}${n.read ? '' : '<span class="sr"> (non lue)</span>'}</span><span class="nf-x">${esc(n.body)}</span><span class="nf-time">${esc(U.ago(n.createdAt))}</span></span><span class="nf-dot" aria-hidden="true"></span></button></li>`;
      };
      const list = groups.filter((g) => g[1].length).map((g) => `<h3 class="day-h">${g[0]}</h3><ul class="rows">${g[1].map(item).join('')}</ul>`).join('');
      return `<div class="page" style="max-width:860px">
        ${UI.head('Notifications', unread ? `${U.plural(unread, 'notification non lue', 'notifications non lues')}. Ouvrez-en une pour voir la page concernée.` : 'Tout est lu.', `<button type="button" class="btn btn-s btn-sm" data-readall${unread ? '' : ' disabled'}>${U.icon('check', 18)}Tout marquer comme lu</button>`)}
        <div class="toolbar">${UI.seg('nf-filter', [{ v: 'all', l: 'Toutes', n: all.length }, { v: 'unread', l: 'Non lues', n: unread }], nf.filter, { label: 'Filtrer les notifications' })}</div>
        ${ns.length ? list : UI.empty('bell', nf.filter === 'unread' ? 'Aucune notification non lue.' : 'Aucune notification.', 'Les changements d’emploi du temps et les nouvelles notes apparaîtront ici.')}
      </div>`;
    },
    bind(root, user) {
      root.querySelectorAll('[data-n]').forEach((b) =>
        b.addEventListener('click', () => {
          S.markRead(b.dataset.n);
          if (b.dataset.type === 'GRADE') location.hash = '#/etudiant/notes';
          else { U.nav.week = 0; U.nav.day = null; location.hash = '#/etudiant/edt'; }
        })
      );
      const all = root.querySelector('[data-readall]');
      if (all) all.addEventListener('click', () => { S.markAllRead(user.id); U.toast('Toutes les notifications sont marquées comme lues.'); U.app.render({ keepScroll: true }); });
      root.querySelectorAll('input[name="nf-filter"]').forEach((r) => r.addEventListener('change', () => { nf.filter = r.value; U.app.render({ keepScroll: true }); }));
    },
  };
})();
