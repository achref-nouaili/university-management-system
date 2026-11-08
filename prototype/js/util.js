/* Utilitaires : dates et heures en français, échappement HTML, pictogrammes, messages */
(function () {
  const U = (window.UMS = window.UMS || {});

  U.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  U.param = (k) => new URLSearchParams(location.search).get(k);
  U.pad = (n) => String(n).padStart(2, '0');
  U.iso = (d) => `${d.getFullYear()}-${U.pad(d.getMonth() + 1)}-${U.pad(d.getDate())}`;
  U.parse = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  // ?today=AAAA-MM-JJ permet de figer la date (démonstration, captures)
  U.now = () => {
    const p = U.param('today');
    const n = new Date();
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) {
      const d = U.parse(p);
      const t = U.param('time');
      if (t && /^\d{2}:\d{2}$/.test(t)) d.setHours(+t.slice(0, 2), +t.slice(3), 0, 0);
      else d.setHours(n.getHours(), n.getMinutes(), 0, 0);
      return d;
    }
    return n;
  };
  U.today = () => {
    const n = U.now();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };
  U.nowMin = () => { const n = U.now(); return n.getHours() * 60 + n.getMinutes(); };
  U.addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  U.dayIdx = (d) => (d.getDay() + 6) % 7; // 0 = lundi
  U.monday = (d) => U.addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -U.dayIdx(d));
  // Semaine de référence : le dimanche, on affiche déjà la semaine qui commence
  U.weekBase = () => { const t = U.today(); return U.addDays(U.monday(t), U.dayIdx(t) === 6 ? 7 : 0); };
  U.isoWeek = (d) => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 86400000 + 1) / 7);
  };
  U.min = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m; };
  U.hm = (m) => `${U.pad(Math.floor(m / 60))}:${U.pad(m % 60)}`;
  U.dur = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h} h ${U.pad(r)}` : `${h} h`) : `${r} min`; };

  const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const DAYS_LONG = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const MONTHS_S = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  U.cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  U.dayShort = (d) => DAYS_SHORT[U.dayIdx(d)];
  U.dayLong = (d) => DAYS_LONG[U.dayIdx(d)];
  U.fmtLong = (d) => `${DAYS_LONG[U.dayIdx(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; // mardi 3 novembre
  U.fmtLongY = (d) => `${U.fmtLong(d)} ${d.getFullYear()}`;
  U.fmtShort = (d) => `${d.getDate()} ${MONTHS_S[d.getMonth()]}`; // 3 nov.
  U.fmtShortY = (d) => `${U.fmtShort(d)} ${d.getFullYear()}`;
  U.fmtDayShort = (d) => `${DAYS_SHORT[U.dayIdx(d)].toLowerCase()}. ${d.getDate()} ${MONTHS_S[d.getMonth()]}`; // mar. 3 nov.
  U.monthLabel = (d) => `${U.cap(MONTHS[d.getMonth()])} ${d.getFullYear()}`;

  // « du 2 au 7 novembre 2026 »
  U.weekRangeText = (mon) => {
    const sat = U.addDays(mon, 5);
    if (mon.getMonth() === sat.getMonth()) return `du ${mon.getDate()} au ${sat.getDate()} ${MONTHS[sat.getMonth()]} ${sat.getFullYear()}`;
    if (mon.getFullYear() === sat.getFullYear()) return `du ${mon.getDate()} ${MONTHS[mon.getMonth()]} au ${sat.getDate()} ${MONTHS[sat.getMonth()]} ${sat.getFullYear()}`;
    return `du ${mon.getDate()} ${MONTHS[mon.getMonth()]} ${mon.getFullYear()} au ${sat.getDate()} ${MONTHS[sat.getMonth()]} ${sat.getFullYear()}`;
  };

  // Moment relatif d'une séance par rapport à maintenant
  U.relSession = (dateIso, start) => {
    const today = U.today(), d = U.parse(dateIso);
    const days = Math.round((d - today) / 86400000);
    if (days === 0) {
      const diff = U.min(start) - U.nowMin();
      if (diff <= 0) return 'maintenant';
      return `dans ${U.dur(diff)}`;
    }
    if (days === 1) return `demain à ${start}`;
    if (days > 1 && days < 7) return `${U.dayLong(d)} à ${start}`;
    return `${U.fmtLong(d)} à ${start}`;
  };

  U.ago = (ts) => {
    const now = U.now().getTime();
    const diff = now - ts;
    const d = new Date(ts);
    const hhmm = `${U.pad(d.getHours())}:${U.pad(d.getMinutes())}`;
    if (diff < 60e3) return 'À l’instant';
    if (diff < 3600e3) return `Il y a ${Math.round(diff / 60e3)} min`;
    if (U.iso(d) === U.iso(U.today())) return `Il y a ${Math.round(diff / 3600e3)} h`;
    if (U.iso(d) === U.iso(U.addDays(U.today(), -1))) return `Hier à ${hhmm}`;
    return `${U.fmtShort(d)} à ${hhmm}`;
  };

  U.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* Pictogrammes : tracé 1,75 px sur grille 24, coins arrondis */
  const I = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18"/>',
    calX: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18M10 13.5l4 4M14 13.5l-4 4"/>',
    calMove: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18M8.5 15h7M13 12.5l2.5 2.5-2.5 2.5"/>',
    grades: '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5"/><path d="M8.5 14.5l2.3 2.3 4.7-4.7"/>',
    pen: '<path d="M12.5 21.5H6.5a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2H14L19.5 8v3"/><path d="M14 2.5V8h5.5"/><path d="M18.6 13.4a1.9 1.9 0 0 1 2.7 2.7L16 21.4l-3.4.9.9-3.4z"/>',
    userx: '<circle cx="9" cy="8" r="4"/><path d="M2.5 21a6.5 6.5 0 0 1 13 0"/><path d="M17.5 8.5l4 4M21.5 8.5l-4 4"/>',
    bell: '<path d="M6 8.5a6 6 0 1 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15 6 8.5"/><path d="M10.2 20.5a2 2 0 0 0 3.6 0"/>',
    roll: '<rect x="8" y="2.5" width="8" height="4" rx="1"/><path d="M16 4.5h1.5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2H8"/><path d="M8.8 14l2.2 2.2 4.4-4.4"/>',
    users: '<path d="M16 21v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V21"/><circle cx="9" cy="7.5" r="4"/><path d="M22 21v-1.5a4 4 0 0 0-3-3.87M16 3.63a4 4 0 0 1 0 7.75"/>',
    book: '<path d="M2.5 4.5h6a3.5 3.5 0 0 1 3.5 3.5v13a2.5 2.5 0 0 0-2.5-2.5h-7z"/><path d="M21.5 4.5h-6A3.5 3.5 0 0 0 12 8v13a2.5 2.5 0 0 1 2.5-2.5h7z"/>',
    overview: '<rect x="3" y="3" width="7.5" height="9" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="5" rx="1.5"/><rect x="13.5" y="11" width="7.5" height="10" rx="1.5"/><rect x="3" y="15" width="7.5" height="6" rx="1.5"/>',
    logout: '<path d="M9 21H5.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2H9"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevL: '<path d="M15 18l-6-6 6-6"/>',
    chevR: '<path d="M9 18l6-6-6-6"/>',
    chevD: '<path d="M6 9l6 6 6-6"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    check: '<path d="M20 6.5L9 17.5l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9.5"/><path d="M8 12.5l2.7 2.7 5.3-5.4"/>',
    warn: '<path d="M10.3 3.9L1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17.2h.01"/>',
    alert: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v5M12 16.2h.01"/>',
    info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 16v-4.5M12 8h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4.3-4.3"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.2 3.1M6.6 6.6A16.5 16.5 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/>',
    pin: '<path d="M19.5 10c0 5.5-7.5 11.5-7.5 11.5S4.5 15.5 4.5 10a7.5 7.5 0 0 1 15 0z"/><circle cx="12" cy="10" r="2.6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    group: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5.2l3.3 2"/>',
    edit: '<path d="M16.9 3.6a2.1 2.1 0 0 1 3 3L8 18.5l-4 1 1-4z"/><path d="M14.5 6l3 3"/>',
    reset: '<path d="M3 12a9 9 0 1 0 2.7-6.4L3 8.2"/><path d="M3 3.5v4.7h4.7"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L20 3M16.5 6.5l2.5 2.5M14 9l2 2"/>',
    send: '<path d="M21.5 2.5L10.5 13.5"/><path d="M21.5 2.5l-7 19-4-8-8-4z"/>',
    door: '<path d="M5 21V8a7 7 0 0 1 14 0v13"/><path d="M3 21h18"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  U.icon = (n, size = 20, cls = '') =>
    `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${I[n] || ''}</svg>`;

  // Message bref ; opts.kind = 'err' ; opts.action = { label, href }
  U.toast = (msg, opts) => {
    opts = typeof opts === 'string' ? { kind: opts } : opts || {};
    let box = document.querySelector('.toasts');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toasts';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    const t = document.createElement('div');
    t.className = 'toast' + (opts.kind === 'err' ? ' err' : '');
    t.innerHTML = (opts.kind === 'err' ? U.icon('alert', 19) : U.icon('checkCircle', 19)) + `<span>${U.esc(msg)}${opts.action ? ` <a href="${U.esc(opts.action.href)}">${U.esc(opts.action.label)}</a>` : ''}</span>`;
    box.appendChild(t);
    const ttl = opts.action ? 6000 : 4200;
    setTimeout(() => t.classList.add('hide'), ttl);
    setTimeout(() => t.remove(), ttl + 350);
  };

  U.initials = (u) => (u.firstName[0] + (u.lastName[0] || '')).toUpperCase();
  U.fmtGrade = (v) => v.toFixed(2).replace('.', ',');
  U.plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
  U.nb = (s) => String(s).replace(/ /g, '\u00a0'); // espaces insécables (ex. « 3 LSI 2 »)
  U.reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
})();
