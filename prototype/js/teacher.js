/* Espace enseignant : Aujourd'hui, Emploi du temps, Notes, Appel */
(function () {
  const U = window.UMS, S = U.store, UI = U.ui, esc = U.esc;
  const V = (U.views = U.views || {});
  V.TEACHER = {};
  const EVALS = ['Devoir', 'Examen', 'TP'];
  const started = (s) => { const iso = U.iso(U.today()); return !s.cancelled && (s.date < iso || (s.date === iso && U.min(s.start) <= U.nowMin())); };
  const rollHref = (s) => `#/enseignant/appel?s=${encodeURIComponent(s.id)}`;
  const notesHref = (cid, label) => `#/enseignant/notes?c=${encodeURIComponent(cid)}&e=${encodeURIComponent(label)}`;

  /* ---------- Aujourd'hui ---------- */
  V.TEACHER.aujourdhui = {
    title: 'Aujourd’hui',
    render(user) {
      const t = U.today(), iso = U.iso(t);
      const list = S.sessionsFor(user, iso, iso);
      const f = UI.focusSession(user);
      const pending = S.sessionsFor(user, U.iso(U.addDays(t, -14)), iso).filter((s) => started(s) && !S.attendanceOf(s.id)).reverse();
      const courses = S.coursesOfTeacher(user.id);
      const signActs = f && f.live ? `<a class="btn btn-w" href="${rollHref(f.s)}">${U.icon('roll', 18)}Faire l’appel</a>` : '';
      const extra = (s, state) => {
        if (state === 'cancel' || state === 'next') return '';
        const done = S.attendanceOf(s.id);
        if (done) { const n = S.absentIds(s.id).length; return `<div class="tl-act">${UI.bd('ok', n ? `Appel fait, ${U.plural(n, 'absent', 'absents')}` : 'Appel fait, aucun absent')}<a class="link" href="${rollHref(s)}" style="font-size:14px">Modifier</a></div>`; }
        return `<div class="tl-act"><a class="btn btn-s btn-sm" href="${rollHref(s)}">${U.icon('roll', 18)}Faire l’appel</a></div>`;
      };
      const evLink = (c, e) => {
        const st = S.evalStatus(c.id, e);
        const v = st.state === 'published' ? ['ok', 'Publiée'] : st.state === 'draft' ? ['warn', 'Brouillon'] : ['', 'À saisir'];
        return `<a class="evl" href="${notesHref(c.id, e)}" aria-label="${esc(`${c.name}, ${e} : ${v[1]}`)}"><span class="evl-k">${e}</span><span class="evl-v"><i class="dot ${v[0]}" aria-hidden="true"></i>${v[1]}</span></a>`;
      };
      const evalRows = courses
        .map((c) => `<li class="evr"><span class="row-main"><span class="row-t">${esc(c.name)}</span><span class="row-s">Groupe ${esc(c.group)}, ${U.plural(S.studentsOfCourse(c.id).length, 'étudiant', 'étudiants')}</span></span><span class="evls">${EVALS.map((e) => evLink(c, e)).join('')}</span></li>`)
        .join('');
      return `<div class="page">
        ${UI.head('Bonjour ' + user.firstName, esc(U.cap(U.fmtLongY(t))))}
        ${UI.sign(f, { mode: 'teacher', actions: signActs })}
        <div class="dash">
          <div class="col"><section class="sec" aria-labelledby="h-day">
            <div class="sec-h"><h2 id="h-day">Séances du jour<span class="n">${list.filter((s) => !s.cancelled).length}</span></h2><a href="#/enseignant/edt">Voir la semaine</a></div>
            ${list.length ? UI.timeline(list, { mode: 'teacher', extra }) : UI.empty('sun', 'Aucune séance aujourd’hui.', f ? `Prochaine séance : ${esc(S.course(f.s.courseId).name)}, ${esc(U.relSession(f.s.date, f.s.start))}.` : '')}
          </section></div>
          <div class="col"><section class="sec" aria-labelledby="h-pend">
            <div class="sec-h"><h2 id="h-pend">Appels à faire<span class="n">${pending.length}</span></h2></div>
            ${pending.length
              ? `<ul class="rows">${pending.slice(0, 5).map((s) => `<li><a class="row" href="${rollHref(s)}"><span class="row-main"><span class="row-t">${esc(S.course(s.courseId).name)} ${UI.tb(s.type)}</span><span class="row-s" style="display:block">${esc(U.cap(U.fmtLong(U.parse(s.date))))}, ${s.start}–${s.end}, salle ${esc(s.room)}</span></span>${U.icon('chevR', 18)}</a></li>`).join('')}</ul>`
              : UI.empty('checkCircle', 'Tous les appels sont faits.', 'Les séances commencées sans appel apparaissent ici.')}
          </section></div>
        </div>
        <section class="sec" aria-labelledby="h-ev">
          ${UI.secHead('Évaluations', null, '<a href="#/enseignant/notes">Saisir des notes</a>')}
          <ul class="rows">${evalRows}</ul>
        </section></div>`;
    },
  };

  /* ---------- Emploi du temps ---------- */
  V.TEACHER.edt = {
    title: 'Emploi du temps',
    render(user) {
      const mon = UI.weekStart();
      const [a, b] = UI.weekRange(mon);
      const ss = S.sessionsFor(user, a, b);
      return `<div class="page wide">
        ${UI.head('Emploi du temps', `${esc(UI.weekSub(mon))}. Sélectionnez une séance commencée pour faire l’appel.`, UI.weekNav())}
        ${UI.week(ss, mon, { mode: 'teacher', href: (s) => (started(s) ? rollHref(s) : null), hrefLabel: 'Faire l’appel' })}</div>`;
    },
    bind(root) { UI.bindWeek(root); },
  };

  /* ---------- Notes : saisie et publication ---------- */
  V.TEACHER.notes = {
    title: 'Notes',
    render(user, ctx) {
      const courses = S.coursesOfTeacher(user.id);
      if (!courses.length) return `<div class="page">${UI.head('Notes')}${UI.empty('book', 'Aucun cours ne vous est confié.', 'La scolarité vous attribue vos cours.')}</div>`;
      const course = courses.find((c) => c.id === ctx.query.get('c')) || courses[0];
      const label = EVALS.includes(ctx.query.get('e')) ? ctx.query.get('e') : 'Devoir';
      const students = S.studentsOfCourse(course.id);
      const ev = S.evaluation(course.id, label);
      const draft = S.draft(course.id, label);
      const opts = EVALS.map((e) => { const st = S.evalStatus(course.id, e).state; return { v: e, l: e, dot: st === 'published' ? 'ok' : st === 'draft' ? 'warn' : '', sr: st === 'published' ? ', publiée' : st === 'draft' ? ', brouillon' : '' }; });
      const val = (st) => { if (ev.published) { const g = ev.rows.find((r) => r.studentId === st.id); return g ? U.fmtGrade(g.value) : '—'; } return draft[st.id] || ''; };
      const rows = students
        .map((st, i) => `<tr data-st="${st.id}"><td class="idx m-hide">${i + 1}</td>
          <td class="g-name"><label for="g-${st.id}"><b>${esc(st.lastName)} ${esc(st.firstName)}</b></label></td>
          <td class="m-end r">${ev.published ? `<span class="g-val">${val(st)}</span>` : `<input class="input g-in" id="g-${st.id}" inputmode="decimal" autocomplete="off" enterkeyhint="next" value="${esc(val(st))}" aria-describedby="m-${st.id}" aria-label="Note de ${esc(S.fullName(st))} sur 20">`}</td>
          <td class="g-cell"><span class="g-st" id="m-${st.id}"></span></td></tr>`)
        .join('');
      const status = ev.published
        ? UI.notice('ok', `Notes publiées le ${U.fmtShortY(U.parse(ev.date))}`, '<p>Les étudiants les voient dans leur espace. Une fois publiées, elles ne sont plus modifiables dans ce prototype.</p>')
        : '';
      return `<div class="page">
        ${UI.head('Notes', `${esc(course.name)}, groupe ${esc(course.group)}. ${U.plural(students.length, 'étudiant inscrit', 'étudiants inscrits')}.`)}
        <div class="toolbar">
          <div class="field" style="width:min(380px,100%)"><label class="label" for="nc">Cours</label><select id="nc" class="select">${courses.map((c) => `<option value="${c.id}"${c.id === course.id ? ' selected' : ''}>${esc(c.name)}, ${esc(c.group)}</option>`).join('')}</select></div>
          <div class="field"><span class="label" id="ne-l">Évaluation</span>${UI.seg('ne', opts, label, { labelledby: 'ne-l' })}</div>
        </div>
        ${status ? `<div style="margin-bottom:24px">${status}</div>` : ''}
        ${UI.stats([{ label: 'Notes saisies', value: '—', id: 'st-n' }, { label: 'Moyenne', value: '—', id: 'st-m' }, { label: 'Plus basse', value: '—', id: 'st-lo' }, { label: 'Plus haute', value: '—', id: 'st-hi' }])}
        <section class="sec sheet" aria-labelledby="h-sheet" style="margin-top:32px">
          ${UI.secHead(`Feuille de notes, ${label.toLowerCase()}`, null, ev.published ? '' : '<span class="hint kbd-hint">Entrée ou flèches pour passer d’un étudiant à l’autre</span>')}
          <table class="tbl tbl-list"><thead><tr><th scope="col" class="m-hide">N°</th><th scope="col">Étudiant</th><th scope="col" class="r">Note /20</th><th scope="col">Contrôle</th></tr></thead><tbody>${rows}</tbody></table>
        </section>
        ${ev.published ? '' : `<div class="actionbar"><p class="ab-sum" id="gsum" aria-live="polite"></p><div class="ab-btns"><button type="button" class="btn btn-s" id="gdraft" aria-label="Enregistrer le brouillon">Enregistrer<span class="m-cut"> le brouillon</span></button><button type="button" class="btn btn-p" id="gpub" aria-label="Publier les notes">${U.icon('send', 18)}Publier<span class="m-cut"> les notes</span></button></div></div>`}
      </div>`;
    },
    bind(root, user, ctx) {
      const courses = S.coursesOfTeacher(user.id);
      if (!courses.length) return;
      const course = courses.find((c) => c.id === ctx.query.get('c')) || courses[0];
      const label = EVALS.includes(ctx.query.get('e')) ? ctx.query.get('e') : 'Devoir';
      const students = S.studentsOfCourse(course.id);
      const ev = S.evaluation(course.id, label);
      const inputs = students.map((st) => root.querySelector('#g-' + st.id)).filter(Boolean);
      const collect = () => { const v = {}; students.forEach((st) => { const i = root.querySelector('#g-' + st.id); v[st.id] = i ? i.value.trim() : ''; }); return v; };
      let saved = JSON.stringify(collect());
      let attempted = false;
      const go = (cid, e) => {
        if (!ev.published && JSON.stringify(collect()) !== saved) { S.saveDraft(course.id, label, collect()); U.toast('Brouillon enregistré automatiquement avant de changer de feuille.'); }
        location.hash = notesHref(cid, e);
      };
      root.querySelector('#nc').addEventListener('change', (e) => go(e.target.value, label));
      root.querySelectorAll('input[name="ne"]').forEach((r) => r.addEventListener('change', () => go(course.id, r.value)));

      const setText = (id, txt) => { const el = root.querySelector('#' + id); if (el) el.textContent = txt; };
      function refresh() {
        let ok = 0, bad = 0, miss = 0;
        const vals = [];
        students.forEach((st) => {
          const msg = root.querySelector('#m-' + st.id);
          if (ev.published) {
            const g = ev.rows.find((r) => r.studentId === st.id);
            if (g) { vals.push(g.value); ok++; }
            msg.className = 'g-st ok'; msg.innerHTML = U.icon('lock', 16) + 'Publiée';
            return;
          }
          const inp = root.querySelector('#g-' + st.id);
          const p = S.parseGrade(inp.value);
          const flagged = p.state === 'invalid' || (attempted && p.state === 'missing');
          inp.classList.toggle('bad', flagged);
          if (flagged) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
          if (p.state === 'ok') { ok++; vals.push(p.value); msg.className = 'g-st ok'; msg.innerHTML = U.icon('check', 16) + 'Valide'; }
          else if (p.state === 'invalid') { bad++; msg.className = 'g-st bad'; msg.innerHTML = U.icon('alert', 16) + 'Entre 0 et 20, deux décimales au plus'; }
          else { miss++; msg.className = attempted ? 'g-st warn' : 'g-st'; msg.innerHTML = attempted ? U.icon('alert', 16) + 'Note manquante' : 'À saisir'; }
        });
        const st = S.gradeStats(vals);
        setText('st-n', `${ok} / ${students.length}`);
        setText('st-m', st.n ? U.fmtGrade(st.mean) : '—');
        setText('st-lo', st.n ? U.fmtGrade(st.min) : '—');
        setText('st-hi', st.n ? U.fmtGrade(st.max) : '—');
        const sum = root.querySelector('#gsum');
        if (sum) {
          const dirty = JSON.stringify(collect()) !== saved;
          sum.innerHTML = `<b>${ok}</b> valide${ok > 1 ? 's' : ''}, <b>${bad}</b> à corriger, <b>${miss}</b> manquante${miss > 1 ? 's' : ''}${dirty ? '. <span style="color:var(--warn)">Modifications non enregistrées.</span>' : ''}`;
        }
        return { ok, bad, miss };
      }
      inputs.forEach((inp, i) => {
        inp.addEventListener('input', refresh);
        inp.addEventListener('focus', () => { inp.closest('tr').classList.add('is-focus'); inp.select(); });
        inp.addEventListener('blur', () => inp.closest('tr').classList.remove('is-focus'));
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); (inputs[i + 1] || root.querySelector('#gpub')).focus(); }
          if (e.key === 'ArrowUp' && inputs[i - 1]) { e.preventDefault(); inputs[i - 1].focus(); }
        });
      });
      refresh();
      if (ev.published) return;
      root.querySelector('#gdraft').addEventListener('click', () => {
        S.saveDraft(course.id, label, collect());
        saved = JSON.stringify(collect());
        const r = refresh();
        U.toast(r.bad ? `Brouillon enregistré. ${U.plural(r.bad, 'note est à corriger', 'notes sont à corriger')} avant la publication.` : 'Brouillon enregistré. Les étudiants ne le voient pas.');
      });
      root.querySelector('#gpub').addEventListener('click', async () => {
        attempted = true;
        const r = refresh();
        if (r.bad || r.miss) {
          U.toast(`Publication impossible : ${r.bad + r.miss} note${r.bad + r.miss > 1 ? 's' : ''} à corriger ou à saisir.`, 'err');
          const first = inputs.find((i) => i.classList.contains('bad'));
          if (first) first.focus();
          return;
        }
        const yes = await UI.confirm({ title: 'Publier les notes ?', text: `${course.name}, ${label.toLowerCase()} : les ${students.length} étudiants verront leur note et recevront une notification. Les notes publiées ne sont plus modifiables.`, ok: 'Publier les notes' });
        if (!yes) return;
        S.publishGrades(course.id, label, collect());
        U.toast(`Notes publiées. ${students.length} étudiants notifiés.`);
        U.app.render({ keepScroll: true });
      });
    },
  };

  /* ---------- Appel ---------- */
  V.TEACHER.appel = {
    title: 'Appel',
    render(user, ctx) {
      const t = U.today();
      const all = S.sessionsFor(user, U.iso(U.addDays(t, -21)), U.iso(t)).filter(started).reverse();
      if (!all.length) return `<div class="page">${UI.head('Appel')}${UI.empty('roll', 'Aucune séance commencée pour le moment.', 'L’appel se fait à partir du début de la séance.')}</div>`;
      let cur = all.find((s) => s.id === ctx.query.get('s'));
      if (!cur) { const nowM = U.nowMin(), iso = U.iso(t); cur = all.find((s) => s.date === iso && U.min(s.start) <= nowM && nowM < U.min(s.end)) || all[0]; }
      const c = S.course(cur.courseId);
      const students = S.studentsOfCourse(c.id);
      const done = S.attendanceOf(cur.id);
      const absent = new Set(S.absentIds(cur.id));
      const byDay = [];
      all.forEach((s) => { let g = byDay.find((x) => x.d === s.date); if (!g) byDay.push((g = { d: s.date, items: [] })); g.items.push(s); });
      const options = byDay.map((g) => `<optgroup label="${esc(U.cap(U.fmtLong(U.parse(g.d))))}">${g.items.map((s) => `<option value="${esc(s.id)}"${s.id === cur.id ? ' selected' : ''}>${s.start}–${s.end}, ${esc(S.course(s.courseId).name)} (${s.type}, ${esc(s.room)})</option>`).join('')}</optgroup>`).join('');
      const absCount = (sid) => S.absencesOf(sid).length;
      const roll = students
        .map((st) => {
          const a = absent.has(st.id), n = absCount(st.id);
          return `<li class="${a ? 'is-abs' : ''}" data-st="${st.id}">${UI.avatar(st)}<span class="nm">${esc(st.lastName)} ${esc(st.firstName)}<span>${n ? U.plural(n, 'absence', 'absences') : 'Aucune absence'}</span></span>
            <span class="pa" role="radiogroup" aria-label="Présence de ${esc(S.fullName(st))}"><label><input type="radio" name="p-${st.id}" value="p"${a ? '' : ' checked'}><span class="p">${U.icon('check')}Présent</span></label><label><input type="radio" name="p-${st.id}" value="a"${a ? ' checked' : ''}><span class="a">${U.icon('x')}Absent</span></label></span></li>`;
        })
        .join('');
      const d = new Date(done ? done.takenAt : 0);
      return `<div class="page" style="max-width:920px">
        ${UI.head('Appel', `${esc(c.name)} (${cur.type}, salle ${esc(cur.room)}), ${esc(U.fmtLong(U.parse(cur.date)))} de ${cur.start} à ${cur.end}. Groupe ${esc(cur.group)}.`)}
        <div class="toolbar"><div class="field" style="width:min(520px,100%)"><label class="label" for="ss">Séance</label><select id="ss" class="select">${options}</select></div></div>
        ${done ? `<div style="margin-bottom:24px">${UI.notice('info', `Appel enregistré le ${U.fmtShort(d)} à ${U.pad(d.getHours())}:${U.pad(d.getMinutes())}`, '<p>Valider à nouveau remplacera cet appel. Les absences déjà justifiées le restent.</p>')}</div>` : ''}
        ${UI.stats([{ label: 'Inscrits', value: students.length }, { label: 'Présents', value: '—', id: 'cp' }, { label: 'Absents', value: '—', id: 'ca' }], 's3')}
        <section class="sec" aria-labelledby="h-roll" style="margin-top:32px">
          ${UI.secHead('Étudiants inscrits', null, '<button type="button" class="btn btn-g btn-sm" id="allp">Tous présents</button>')}
          <ul class="roll" id="roll">${roll}</ul>
          <p class="hint" style="margin-top:12px">Le nombre d’absences sous chaque nom porte sur le semestre. Les absences sont enregistrées comme non justifiées ; la scolarité les justifie sur présentation d’un justificatif.</p>
        </section>
        <div class="actionbar"><p class="ab-sum" id="rsum" aria-live="polite"></p><div class="ab-btns"><button type="button" class="btn btn-p" id="valid">${U.icon('check', 18)}Valider l’appel</button></div></div>
      </div>`;
    },
    bind(root, user) {
      const sel = root.querySelector('#ss');
      if (!sel) return;
      sel.addEventListener('change', () => (location.hash = rollHref({ id: sel.value })));
      const s = S.session(sel.value), students = S.studentsOfCourse(s.courseId);
      const absentList = () => students.filter((st) => root.querySelector(`input[name="p-${st.id}"][value="a"]`).checked).map((st) => st.id);
      const count = () => {
        const ab = absentList();
        root.querySelector('#ca').textContent = ab.length;
        root.querySelector('#cp').textContent = students.length - ab.length;
        root.querySelectorAll('#roll li').forEach((li) => li.classList.toggle('is-abs', ab.includes(li.dataset.st)));
        root.querySelector('#rsum').innerHTML = `<b>${students.length - ab.length}</b> présent${students.length - ab.length > 1 ? 's' : ''}, <b>${ab.length}</b> absent${ab.length > 1 ? 's' : ''}`;
      };
      root.querySelector('#roll').addEventListener('change', count);
      root.querySelector('#allp').addEventListener('click', () => { students.forEach((st) => (root.querySelector(`input[name="p-${st.id}"][value="p"]`).checked = true)); count(); });
      count();
      root.querySelector('#valid').addEventListener('click', () => {
        const ab = absentList();
        S.takeAttendance(s.id, ab, user.id);
        U.toast(`Appel validé : ${students.length - ab.length} présent${students.length - ab.length > 1 ? 's' : ''}, ${ab.length} absent${ab.length > 1 ? 's' : ''}.`);
        U.app.render({ keepScroll: true });
      });
    },
  };
})();
