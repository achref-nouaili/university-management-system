/* "Base de données" du prototype : tout est stocké dans le navigateur (localStorage).
   Les tables reprennent le schéma du dossier de conception :
   users, courses, enrollments, timetable (sessions), grades, absences, notifications. */
(function () {
  const U = window.UMS;
  const KEY = 'ums-proto-v3';
  const SKEY = 'ums-session-v3';
  const VERSION = 1;
  const mem = {};
  const lsGet = (k) => {
    if (k in mem) return mem[k];
    try { return localStorage.getItem(k); } catch (e) { return null; }
  };
  const lsSet = (k, v) => {
    try { localStorage.setItem(k, v); delete mem[k]; } catch (e) { mem[k] = v; }
  };
  const lsDel = (k) => {
    delete mem[k];
    try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
  };

  const SLOTS = [['08:30', '10:00'], ['10:15', '11:45'], ['14:00', '15:30'], ['15:45', '17:15']];
  const TYPES = ['Cours', 'TD', 'TP'];
  const GROUPS = ['3 LSI 2', '3 LSI 1'];
  const ROOMS = ['Amphi A', 'B12', 'B14', 'Labo 2', 'Labo 3'];
  const DEMO_PASSWORD = 'demo123';

  let state = null;

  /* ---------- Données de départ ---------- */
  function seed() {
    const today = U.today();
    const now = U.now().getTime();
    const mon = U.weekBase();
    const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
    const users = [];
    const mk = (id, first, last, role, extra) =>
      users.push(Object.assign({ id, firstName: first, lastName: last, email: `${slug(first)}.${slug(last)}@ums.test`, password: DEMO_PASSWORD, role, group: null, title: null, f: false, createdAt: role === 'STUDENT' ? '2026-09-15' : '2026-09-01' }, extra || {}));

    // Enseignants
    mk('t1', 'Karim', 'Trabelsi', 'TEACHER', { title: 'M.' });
    mk('t2', 'Leila', 'Mansouri', 'TEACHER', { title: 'Mme', f: true });
    mk('t3', 'Hela', 'Jlassi', 'TEACHER', { title: 'Mme', f: true });
    mk('t4', 'Rim', 'Ben Salah', 'TEACHER', { title: 'Mme', f: true });
    mk('t5', 'Slim', 'Ayari', 'TEACHER', { title: 'M.' });
    mk('t6', 'Walid', 'Gharbi', 'TEACHER', { title: 'M.' });
    // Administration
    mk('a1', 'Sonia', 'Khelifi', 'ADMIN', { f: true, adminLabel: 'Scolarité' });
    // Étudiants 3 LSI 2
    const s2 = [['Rania', 'Baccouche', 1], ['Amira', 'Ben Ali', 1], ['Ines', 'Chaabane', 1], ['Aziz', 'Ferchichi', 0], ['Youssef', 'Hamdi', 0], ['Nour', 'Kefi', 1], ['Oussama', 'Mejri', 0], ['Hamza', 'Riahi', 0], ['Mehdi', 'Saidi', 0], ['Sarra', 'Toumi', 1]];
    s2.forEach((s, i) => mk('s' + (i + 1), s[0], s[1], 'STUDENT', { group: '3 LSI 2', f: !!s[2], createdAt: s[1] === 'Saidi' ? '2026-09-16' : '2026-09-15' }));
    // Étudiants 3 LSI 1
    mk('s11', 'Marwen', 'Ayadi', 'STUDENT', { group: '3 LSI 1' });
    mk('s12', 'Salma', 'Dridi', 'STUDENT', { group: '3 LSI 1', f: true });
    mk('s13', 'Omar', 'Zouari', 'STUDENT', { group: '3 LSI 1' });

    const courses = [
      { id: 'c1', name: 'Big Data', teacherId: 't1', group: '3 LSI 2' },
      { id: 'c2', name: 'Virtualisation et Cloud', teacherId: 't4', group: '3 LSI 2' },
      { id: 'c3', name: 'SOA et services web', teacherId: 't3', group: '3 LSI 2' },
      { id: 'c4', name: 'Applications réparties', teacherId: 't2', group: '3 LSI 2' },
      { id: 'c5', name: 'Développement mobile', teacherId: 't6', group: '3 LSI 2' },
      { id: 'c6', name: 'Gestion de projet agile', teacherId: 't5', group: '3 LSI 2' },
      { id: 'c7', name: 'SOA et services web', teacherId: 't3', group: '3 LSI 1' },
      { id: 'c8', name: 'Big Data', teacherId: 't1', group: '3 LSI 1' },
    ];

    const enrollments = [];
    for (let i = 1; i <= 10; i++) for (let c = 1; c <= 6; c++) enrollments.push({ studentId: 's' + i, courseId: 'c' + c, status: 'ACTIVE' });
    for (let i = 11; i <= 13; i++) for (const c of [7, 8]) enrollments.push({ studentId: 's' + i, courseId: 'c' + c, status: 'ACTIVE' });

    // Emploi du temps hebdomadaire (jour 0 = lundi ; créneau 0..3)
    const tpl2 = [
      [0, 0, 'c1', 'Cours', 'Amphi A'], [0, 1, 'c3', 'TD', 'B12'], [0, 2, 'c5', 'TP', 'Labo 2'],
      [1, 0, 'c2', 'Cours', 'Amphi A'], [1, 1, 'c6', 'Cours', 'B12'], [1, 2, 'c4', 'Cours', 'B14'],
      [2, 0, 'c3', 'Cours', 'Amphi A'], [2, 1, 'c2', 'TP', 'Labo 2'], [2, 2, 'c6', 'TD', 'B14'],
      [3, 0, 'c4', 'TP', 'Labo 3'], [3, 1, 'c1', 'TP', 'B12'],
      [4, 0, 'c5', 'Cours', 'Amphi A'], [4, 1, 'c1', 'TD', 'B12'],
      [5, 0, 'c4', 'TD', 'B14'],
    ];
    const tpl1 = [
      [1, 1, 'c8', 'Cours', 'Amphi A'], [2, 1, 'c7', 'Cours', 'Amphi A'],
      [3, 3, 'c7', 'TD', 'B12'], [4, 2, 'c8', 'TD', 'B12'],
    ];
    const sessions = [];
    const key = (w, d, sl, c) => `se-${w}-${d}-${sl}-${c}`;
    for (let w = -6; w <= 6; w++) {
      const m = U.addDays(mon, 7 * w);
      [tpl2, tpl1].forEach((tpl) =>
        tpl.forEach(([d, sl, c, type, room]) => {
          const course = courses.find((x) => x.id === c);
          const s = { id: key(w, d, sl, c), courseId: c, group: course.group, type, room, date: U.iso(U.addDays(m, d)), start: SLOTS[sl][0], end: SLOTS[sl][1], modified: false, cancelled: false, prev: null };
          // Séance déplacée cette semaine : TP de Big Data du jeudi
          if (w === 0 && d === 3 && sl === 1 && c === 'c1') {
            s.prev = { date: s.date, start: s.start, end: s.end, room: s.room };
            s.start = SLOTS[3][0]; s.end = SLOTS[3][1]; s.room = 'Labo 3'; s.modified = true;
          }
          // Séance annulée la semaine dernière (cohérente avec la notification de départ)
          if (w === -1 && d === 1 && sl === 1 && c === 'c6') s.cancelled = true;
          sessions.push(s);
        })
      );
    }

    // Notes publiées
    const evals = [
      ['c3', 'Devoir', 1, 16], ['c1', 'Examen', 6, 14.5], ['c2', 'Devoir', 13, 12.75], ['c5', 'TP', 15, 15], ['c4', 'TP', 20, 13.5],
    ];
    const pool = [9.5, 10, 11.25, 12, 12.5, 13, 13.75, 14, 14.5, 15.25, 15.5, 16.5, 17, 8.5, 11.5, 10.75];
    const grades = [];
    let gid = 1;
    evals.forEach(([c, label, ago, amira], ei) => {
      const pub = U.iso(U.addDays(today, -ago));
      for (let i = 1; i <= 10; i++) {
        const value = i === 2 ? amira : pool[(i * 5 + ei * 3) % pool.length];
        grades.push({ id: 'g' + gid++, studentId: 's' + i, courseId: c, label, value, publicationDate: pub });
      }
    });

    // Absences (Amira) + quelques autres
    const sid = (w, d, sl, c) => key(w, d, sl, c);
    const absences = [
      { id: 'ab1', studentId: 's2', sessionId: sid(-1, 3, 0, 'c4'), status: 'UNJUSTIFIED' },
      { id: 'ab2', studentId: 's2', sessionId: sid(-2, 0, 0, 'c1'), status: 'JUSTIFIED' },
      { id: 'ab3', studentId: 's2', sessionId: sid(-3, 1, 1, 'c6'), status: 'UNJUSTIFIED' },
      { id: 'ab4', studentId: 's5', sessionId: sid(-1, 3, 0, 'c4'), status: 'UNJUSTIFIED' },
      { id: 'ab5', studentId: 's8', sessionId: sid(-1, 3, 0, 'c4'), status: 'UNJUSTIFIED' },
    ];
    // Appels déjà faits pour les séances passées, sauf une (pour montrer « Appels à faire »)
    const attendance = [];
    const todayIso = U.iso(today), pendingId = key(-1, 5, 0, 'c4');
    sessions.forEach((s) => {
      if (s.cancelled || s.date >= todayIso || s.id === pendingId) return;
      const tch = courses.find((c) => c.id === s.courseId).teacherId;
      const at = U.parse(s.date); at.setHours(+s.start.slice(0, 2), +s.start.slice(3) + 7, 0, 0);
      attendance.push({ sessionId: s.id, takenAt: at.getTime(), takenBy: tch });
    });
    absences.forEach((a) => { if (!attendance.find((x) => x.sessionId === a.sessionId)) attendance.push({ sessionId: a.sessionId, takenAt: now - 5 * 86400e3, takenBy: 't2' }); });

    // Notifications des étudiants du groupe 3 LSI 2
    const thu = U.addDays(mon, 3);
    const yest = U.addDays(today, -1); yest.setHours(18, 20, 0, 0);
    const at = (daysAgo) => { const d = U.addDays(today, -daysAgo); d.setHours(17, 5, 0, 0); return d.getTime(); };
    const notifications = [];
    let nid = 1;
    for (let i = 1; i <= 10; i++) {
      const u = 's' + i;
      const add = (type, title, body, ts, read) => notifications.push({ id: 'n' + nid++, userId: u, type, title, body, createdAt: ts, read });
      add('TIMETABLE', 'Changement d’emploi du temps', `Le TP de Big Data du ${U.fmtLong(thu)} passe de 10:15–11:45 (B12) à 15:45–17:15 (Labo 3).`, now - 2 * 3600e3, false);
      add('GRADE', 'Nouvelle note publiée', 'SOA et services web · Devoir : votre note est disponible.', yest.getTime(), false);
      add('GRADE', 'Nouvelle note publiée', 'Big Data · Examen : votre note est disponible.', at(6), true);
      add('CANCEL', 'Séance annulée', `Le Cours de Gestion de projet agile du ${U.fmtLong(U.addDays(mon, -7 + 1))} (10:15–11:45, B12) est annulé.`, at(8), true);
      add('GRADE', 'Nouvelle note publiée', 'Virtualisation et Cloud · Devoir : votre note est disponible.', at(13), true);
    }

    return { meta: { v: VERSION, anchor: U.iso(mon) }, users, courses, enrollments, sessions, grades, drafts: {}, absences, attendance, notifications, seq: 1000 };
  }

  /* ---------- Chargement / sauvegarde ---------- */
  function init() {
    let st = null;
    try { st = JSON.parse(lsGet(KEY) || 'null'); } catch (e) { st = null; }
    const mon = U.weekBase();
    if (st && st.meta && st.meta.v === VERSION) {
      const gap = Math.abs(mon - U.parse(st.meta.anchor)) / (7 * 86400e3);
      if (gap > 5) st = null; // les données de départ couvrent ±6 semaines
    } else st = null;
    state = st || seed();
    save();
    return state;
  }
  function save() { lsSet(KEY, JSON.stringify(state)); }
  function reset() { lsDel(KEY); state = seed(); save(); }
  const uid = (p) => `${p}${++state.seq}`;

  /* ---------- Requêtes ---------- */
  const S = (window.UMS.store = {});
  S.init = init; S.save = save; S.reset = reset;
  S.TYPES = TYPES; S.GROUPS = GROUPS; S.ROOMS = ROOMS; S.SLOTS = SLOTS; S.DEMO_PASSWORD = DEMO_PASSWORD;
  S.users = () => state.users;
  S.courses = () => state.courses;
  S.user = (id) => state.users.find((u) => u.id === id);
  S.course = (id) => state.courses.find((c) => c.id === id);
  S.session = (id) => state.sessions.find((s) => s.id === id);
  S.fullName = (u) => `${u.firstName} ${u.lastName}`;
  S.teacherLabel = (u) => (u ? `${u.title ? u.title + ' ' : ''}${u.lastName}` : '—');
  S.roleLabel = (u) => {
    if (u.role === 'STUDENT') return u.f ? 'Étudiante' : 'Étudiant';
    if (u.role === 'TEACHER') return u.f ? 'Enseignante' : 'Enseignant';
    return 'Administrateur';
  };
  S.subLabel = (u) => (u.role === 'STUDENT' ? `${S.roleLabel(u)}, ${u.group || ''}` : u.role === 'ADMIN' ? u.adminLabel || 'Administration' : S.roleLabel(u));
  S.byName = (a, b) => a.lastName.localeCompare(b.lastName, 'fr') || a.firstName.localeCompare(b.firstName, 'fr');
  S.coursesOfStudent = (sid) =>
    state.enrollments.filter((e) => e.studentId === sid && e.status === 'ACTIVE').map((e) => S.course(e.courseId)).filter(Boolean);
  S.studentsOfCourse = (cid) =>
    state.enrollments.filter((e) => e.courseId === cid && e.status === 'ACTIVE').map((e) => S.user(e.studentId)).filter(Boolean).sort(S.byName);
  S.coursesOfTeacher = (tid) => state.courses.filter((c) => c.teacherId === tid);
  S.isEnrolled = (sid, cid) => state.enrollments.some((e) => e.studentId === sid && e.courseId === cid && e.status === 'ACTIVE');

  S.sessionsFor = (user, fromIso, toIso, group) => {
    let ids = null;
    if (user && user.role === 'STUDENT') ids = new Set(S.coursesOfStudent(user.id).map((c) => c.id));
    else if (user && user.role === 'TEACHER') ids = new Set(S.coursesOfTeacher(user.id).map((c) => c.id));
    return state.sessions
      .filter((s) => s.date >= fromIso && s.date <= toIso && (!ids || ids.has(s.courseId)) && (!group || s.group === group))
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  };

  // Texte d'un changement : « Le TP de Big Data du jeudi 5 novembre passe de 10:15–11:45 (B12) à 15:45–17:15 (Labo 3). »
  S.changeMessage = (before, after, course) => {
    const dOld = U.fmtLong(U.parse(before.date)), dNew = U.fmtLong(U.parse(after.date));
    const base = `Le ${before.type} de ${course.name} du ${dOld}`;
    if (before.date !== after.date) return `${base} est déplacé au ${dNew}, ${after.start}–${after.end} (${after.room}).`;
    const sameTime = before.start === after.start && before.end === after.end;
    if (sameTime && before.room !== after.room) return `${base} (${after.start}–${after.end}) change de salle : ${after.room} au lieu de ${before.room}.`;
    if (!sameTime && before.room === after.room && before.start !== after.start) return `${base} passe de ${before.start}–${before.end} à ${after.start}–${after.end}, salle ${after.room}.`;
    if (before.start !== after.start || before.room !== after.room) return `${base} passe de ${before.start}–${before.end} (${before.room}) à ${after.start}–${after.end} (${after.room}).`;
    if (before.end !== after.end) return `${base} se termine désormais à ${after.end} au lieu de ${before.end}.`;
    if (before.type !== after.type) return `${base} devient un ${after.type}.`;
    return `${base} a été modifié.`;
  };
  S.changeText = (s) => {
    const c = S.course(s.courseId);
    if (!s.prev) return `Le ${s.type} de ${c.name} du ${U.fmtLong(U.parse(s.date))} a été modifié.`;
    return S.changeMessage(Object.assign({ type: s.type }, s.prev), s, c);
  };

  S.notificationsOf = (uid_) => state.notifications.filter((n) => n.userId === uid_).sort((a, b) => b.createdAt - a.createdAt);
  S.unreadCount = (uid_) => state.notifications.filter((n) => n.userId === uid_ && !n.read).length;
  S.markRead = (id) => { const n = state.notifications.find((x) => x.id === id); if (n) { n.read = true; save(); } };
  S.markAllRead = (uid_) => { state.notifications.forEach((n) => { if (n.userId === uid_) n.read = true; }); save(); };
  const notify = (userIds, type, title, body) => {
    const ts = U.now().getTime();
    userIds.forEach((id) => state.notifications.push({ id: uid('n'), userId: id, type, title, body, createdAt: ts, read: false }));
  };

  /* ---------- Authentification (simulée) ---------- */
  S.login = (email, password) => {
    const e = (email || '').trim().toLowerCase();
    const u = state.users.find((x) => x.email.toLowerCase() === e);
    if (!u || u.password !== password) return null;
    lsSet(SKEY, u.id);
    return u;
  };
  S.currentUser = () => { const id = lsGet(SKEY); return id ? S.user(id) || null : null; };
  S.logout = () => lsDel(SKEY);

  /* ---------- Notes ---------- */
  const draftKey = (cid, label) => `${cid}|${label}`;
  S.parseGrade = (raw) => {
    const t = String(raw == null ? '' : raw).trim();
    if (t === '') return { state: 'missing' };
    if (!/^\d+([.,]\d{1,2})?$/.test(t)) return { state: 'invalid' };
    const v = parseFloat(t.replace(',', '.'));
    if (v < 0 || v > 20) return { state: 'invalid' };
    return { state: 'ok', value: v };
  };
  S.evaluation = (cid, label) => {
    const rows = state.grades.filter((g) => g.courseId === cid && g.label === label);
    const published = rows.length > 0 && rows.every((g) => g.publicationDate);
    return { published, date: published ? rows[0].publicationDate : null, rows };
  };
  S.draft = (cid, label) => state.drafts[draftKey(cid, label)] || {};
  S.saveDraft = (cid, label, values) => { state.drafts[draftKey(cid, label)] = values; save(); };
  S.publishGrades = (cid, label, values) => {
    const course = S.course(cid);
    const students = S.studentsOfCourse(cid);
    const pubDate = U.iso(U.today());
    students.forEach((st) => {
      const p = S.parseGrade(values[st.id]);
      state.grades.push({ id: uid('g'), studentId: st.id, courseId: cid, label, value: p.value, publicationDate: pubDate });
    });
    delete state.drafts[draftKey(cid, label)];
    notify(students.map((s) => s.id), 'GRADE', 'Nouvelle note publiée', `${course.name} · ${label} : votre note est disponible.`);
    save();
  };
  S.gradesOf = (sid) =>
    state.grades.filter((g) => g.studentId === sid && g.publicationDate).sort((a, b) => b.publicationDate.localeCompare(a.publicationDate));

  /* ---------- Absences / appel ---------- */
  S.attendanceOf = (sessionId) => state.attendance.find((a) => a.sessionId === sessionId) || null;
  S.absentIds = (sessionId) => state.absences.filter((a) => a.sessionId === sessionId).map((a) => a.studentId);
  S.takeAttendance = (sessionId, absentIds, byId) => {
    const prev = {};
    state.absences.filter((a) => a.sessionId === sessionId).forEach((a) => (prev[a.studentId] = a.status));
    state.absences = state.absences.filter((a) => a.sessionId !== sessionId);
    absentIds.forEach((id) => state.absences.push({ id: uid('ab'), studentId: id, sessionId, status: prev[id] || 'UNJUSTIFIED' }));
    state.attendance = state.attendance.filter((a) => a.sessionId !== sessionId);
    state.attendance.push({ sessionId, takenAt: U.now().getTime(), takenBy: byId });
    save();
  };
  S.absencesOf = (sid) =>
    state.absences
      .filter((a) => a.studentId === sid)
      .map((a) => Object.assign({}, a, { session: S.session(a.sessionId) }))
      .filter((a) => a.session)
      .sort((x, y) => y.session.date.localeCompare(x.session.date));

  /* ---------- Emploi du temps (administration) ---------- */
  const overlap = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;
  const fail = (error, title, field) => ({ ok: false, error, title: title || 'Saisie à corriger', field: field || null });
  S.roomsAll = () => {
    const set = new Map();
    ROOMS.concat(state.sessions.map((s) => s.room)).forEach((r) => { if (r && !set.has(r.toLowerCase())) set.set(r.toLowerCase(), r); });
    return [...set.values()].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
  };
  S.freeRooms = (date, start, end, excludeId) => {
    if (!date || !start || !end || start >= end) return [];
    return S.roomsAll().filter((r) => !state.sessions.some((s) => s.id !== excludeId && !s.cancelled && s.date === date && s.room.toLowerCase() === r.toLowerCase() && overlap(s.start, s.end, start, end)));
  };
  // Vérifie une séance sans l'enregistrer (champs + conflits de salle, d'enseignant, de groupe)
  S.checkSession = (d) => {
    const course = S.course(d.courseId);
    if (!course) return fail('Choisissez un cours.', null, 'course');
    if (!TYPES.includes(d.type)) return fail('Choisissez le type de séance.', null, 'type');
    if (!d.date) return fail('Choisissez une date.', null, 'date');
    if (U.dayIdx(U.parse(d.date)) === 6) return fail('Le dimanche n’est pas un jour de cours. Choisissez une autre date.', null, 'date');
    if (!/^\d\d:\d\d$/.test(d.start || '') || !/^\d\d:\d\d$/.test(d.end || '')) return fail('Indiquez l’heure de début et l’heure de fin.', null, 'time');
    if (d.start >= d.end) return fail('L’heure de fin doit être après l’heure de début.', null, 'time');
    const room = (d.room || '').trim();
    if (!room) return fail('Indiquez la salle.', null, 'room');
    const others = state.sessions.filter((s) => s.id !== d.id && !s.cancelled && s.date === d.date && overlap(s.start, s.end, d.start, d.end));
    const when = (s) => `le ${U.fmtLong(U.parse(s.date))} de ${s.start} à ${s.end}`;
    const rc = others.find((s) => s.room.toLowerCase() === room.toLowerCase());
    if (rc) { const c = S.course(rc.courseId); return fail(`${rc.room} est déjà occupée ${when(rc)} par ${c.name} (${c.group}). Choisissez une salle libre ou un autre créneau.`, 'Salle déjà occupée', 'room'); }
    const tc = others.find((s) => S.course(s.courseId).teacherId === course.teacherId);
    if (tc) return fail(`${S.teacherLabel(S.user(course.teacherId))} a déjà une séance ${when(tc)} (${S.course(tc.courseId).name}, ${tc.group}). Choisissez un autre créneau.`, 'Enseignant indisponible', 'time');
    const gc = others.find((s) => s.group === course.group);
    if (gc) return fail(`Le groupe ${course.group} a déjà ${S.course(gc.courseId).name} ${when(gc)}. Choisissez un autre créneau.`, 'Groupe déjà occupé', 'time');
    return { ok: true, course, room };
  };
  // Aperçu : le message exact que recevront les étudiants
  S.previewSession = (d) => {
    const chk = S.checkSession(d);
    if (!chk.ok) return chk;
    const course = chk.course, room = chk.room;
    const recipients = S.studentsOfCourse(course.id).length;
    const after = { date: d.date, start: d.start, end: d.end, room, type: d.type };
    if (!d.id) return { ok: true, created: true, recipients, after, message: `Nouvelle séance : ${d.type} de ${course.name} le ${U.fmtLong(U.parse(d.date))}, ${d.start}–${d.end} (${room}).` };
    const s = S.session(d.id);
    const changed = s.date !== d.date || s.start !== d.start || s.end !== d.end || s.room !== room || s.type !== d.type;
    if (!changed) return { ok: true, unchanged: true, recipients };
    return { ok: true, recipients, after, message: S.changeMessage(s, after, course) };
  };
  S.saveSession = (d) => {
    const p = S.previewSession(d);
    if (!p.ok) return p;
    const course = S.course(d.courseId);
    if (p.unchanged) return Object.assign({ session: S.session(d.id), notified: 0 }, p);
    const ids = S.studentsOfCourse(course.id).map((s) => s.id);
    let s;
    if (p.created) {
      s = Object.assign({ id: uid('se-'), courseId: course.id, group: course.group, modified: false, cancelled: false, prev: null }, p.after);
      state.sessions.push(s);
    } else {
      s = S.session(d.id);
      if (!s.prev) s.prev = { date: s.date, start: s.start, end: s.end, room: s.room };
      Object.assign(s, p.after, { modified: true });
    }
    notify(ids, 'TIMETABLE', p.created ? 'Nouvelle séance' : 'Changement d’emploi du temps', p.message);
    save();
    return Object.assign({ session: s, notified: ids.length }, p);
  };
  S.cancelSession = (id) => {
    const s = S.session(id);
    if (!s) return 0;
    s.cancelled = true;
    const c = S.course(s.courseId);
    const ids = S.studentsOfCourse(c.id).map((x) => x.id);
    notify(ids, 'CANCEL', 'Séance annulée', `Le ${s.type} de ${c.name} du ${U.fmtLong(U.parse(s.date))} (${s.start}–${s.end}, ${s.room}) est annulé.`);
    save();
    return ids.length;
  };
  S.changesBetween = (fromIso, toIso) => state.sessions.filter((s) => s.date >= fromIso && s.date <= toIso && (s.modified || s.cancelled)).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));

  /* ---------- Utilisateurs, cours, inscriptions ---------- */
  const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  S.addUser = (d) => {
    const first = (d.firstName || '').trim(), last = (d.lastName || '').trim(), email = (d.email || '').trim().toLowerCase();
    if (!first) return fail('Indiquez le prénom.', null, 'firstName');
    if (!last) return fail('Indiquez le nom.', null, 'lastName');
    if (!emailOk(email)) return fail('Saisissez une adresse e-mail complète, par exemple prenom.nom@ums.test.', null, 'email');
    if (state.users.some((u) => u.email.toLowerCase() === email)) return fail('Un compte utilise déjà cette adresse e-mail.', null, 'email');
    if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(d.role)) return fail('Choisissez un rôle.', null, 'role');
    if ((d.password || '').length < 6) return fail('Le mot de passe provisoire doit contenir au moins 6 caractères.', null, 'password');
    const u = { id: uid('u'), firstName: first, lastName: last, email, password: d.password, role: d.role, group: d.role === 'STUDENT' ? d.group || '3 LSI 2' : null, title: null, f: false, createdAt: U.iso(U.today()) };
    state.users.push(u);
    if (u.role === 'STUDENT') state.courses.filter((c) => c.group === u.group).forEach((c) => state.enrollments.push({ studentId: u.id, courseId: c.id, status: 'ACTIVE' }));
    save();
    return { ok: true, user: u };
  };
  S.updateUser = (id, d, actorId) => {
    const u = S.user(id);
    const first = (d.firstName || '').trim(), last = (d.lastName || '').trim(), email = (d.email || '').trim().toLowerCase();
    if (!first) return fail('Indiquez le prénom.', null, 'firstName');
    if (!last) return fail('Indiquez le nom.', null, 'lastName');
    if (!emailOk(email)) return fail('Saisissez une adresse e-mail complète, par exemple prenom.nom@ums.test.', null, 'email');
    if (state.users.some((x) => x.id !== id && x.email.toLowerCase() === email)) return fail('Un compte utilise déjà cette adresse e-mail.', null, 'email');
    if (d.password && d.password.length < 6) return fail('Le nouveau mot de passe doit contenir au moins 6 caractères.', null, 'password');
    if (d.role !== u.role) {
      if (id === actorId) return fail('Vous ne pouvez pas changer votre propre rôle.', null, 'role');
      if (u.role === 'TEACHER' && S.coursesOfTeacher(id).length) return fail(`${S.fullName(u)} est responsable de ${S.coursesOfTeacher(id).length} cours. Confiez-les à un autre enseignant avant de changer son rôle.`, null, 'role');
    }
    u.firstName = first; u.lastName = last; u.email = email;
    if (d.password) u.password = d.password;
    const newGroup = d.role === 'STUDENT' ? d.group || u.group || '3 LSI 2' : null;
    if (d.role !== u.role || (u.role === 'STUDENT' && newGroup !== u.group)) {
      u.role = d.role;
      u.group = newGroup;
      if (d.role === 'STUDENT') state.courses.filter((c) => c.group === u.group).forEach((c) => { if (!S.isEnrolled(u.id, c.id)) S.setEnrollment(u.id, c.id, true, true); });
    }
    save();
    return { ok: true, user: u };
  };
  S.addCourse = (d) => {
    const name = (d.name || '').trim();
    if (!name) return fail('Indiquez le nom du cours.', null, 'name');
    const t = S.user(d.teacherId);
    if (!t || t.role !== 'TEACHER') return fail('Choisissez un enseignant.', null, 'teacher');
    if (state.courses.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.group === d.group)) return fail(`Le cours « ${name} » existe déjà pour ${d.group}.`, null, 'name');
    const c = { id: uid('c'), name, teacherId: t.id, group: d.group };
    state.courses.push(c);
    state.users.filter((u) => u.role === 'STUDENT' && u.group === d.group).forEach((u) => state.enrollments.push({ studentId: u.id, courseId: c.id, status: 'ACTIVE' }));
    save();
    return { ok: true, course: c };
  };
  S.setEnrollment = (sid, cid, on, noSave) => {
    const e = state.enrollments.find((x) => x.studentId === sid && x.courseId === cid);
    if (e) e.status = on ? 'ACTIVE' : 'CANCELLED';
    else if (on) state.enrollments.push({ studentId: sid, courseId: cid, status: 'ACTIVE' });
    if (!noSave) save();
  };
  S.students = () => state.users.filter((u) => u.role === 'STUDENT').sort(S.byName);
  S.teachers = () => state.users.filter((u) => u.role === 'TEACHER').sort(S.byName);
  S.countRole = (r) => state.users.filter((u) => u.role === r).length;
  S.unjustifiedCount = () => state.absences.filter((a) => a.status === 'UNJUSTIFIED').length;

  /* ---------- Statistiques de notes ---------- */
  S.gradeStats = (vals) => {
    const v = vals.filter((x) => typeof x === 'number' && !isNaN(x));
    if (!v.length) return { n: 0 };
    const sum = v.reduce((a, b) => a + b, 0);
    return { n: v.length, mean: sum / v.length, min: Math.min(...v), max: Math.max(...v) };
  };
  S.evalStatus = (cid, label) => {
    const ev = S.evaluation(cid, label);
    if (ev.published) return { state: 'published', date: ev.date };
    const dr = S.draft(cid, label);
    if (Object.values(dr).some((x) => String(x || '').trim() !== '')) return { state: 'draft' };
    return { state: 'none' };
  };
})();
