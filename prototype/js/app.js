/* Routeur (#/...), connexion, déconnexion, réinitialisation */
(function () {
  const U = window.UMS, S = U.store, UI = U.ui, esc = U.esc;
  const root = document.getElementById('app');
  const DEMO = [
    ['amira.benali@ums.test', { firstName: 'Amira', lastName: 'Ben Ali' }, 'Étudiante en 3 LSI 2', 'Sa semaine, ses notes, ses absences'],
    ['leila.mansouri@ums.test', { firstName: 'Leila', lastName: 'Mansouri' }, 'Enseignante, Applications réparties', 'Saisie des notes et appel'],
    ['sonia.khelifi@ums.test', { firstName: 'Sonia', lastName: 'Khelifi' }, 'Scolarité', 'Emploi du temps, comptes et cours'],
  ];

  function loginView() {
    return `<div class="login">
      <aside class="login-aside">
        ${UI.brand('#/connexion')}
        <div><h1>Votre semaine, vos notes, vos absences.</h1>
          <p class="intro">Les changements d’horaire et les nouvelles notes arrivent ici dès qu’ils sont publiés, pour les étudiants, les enseignants et la scolarité.</p></div>
        <ul class="roles">
          <li>${U.icon('calendar')}<b>Étudiants</b><span>Consultent leur emploi du temps, leurs notes publiées et leurs absences.</span></li>
          <li>${U.icon('roll')}<b>Enseignants</b><span>Saisissent et publient les notes, font l’appel.</span></li>
          <li>${U.icon('users')}<b>Scolarité</b><span>Tient l’emploi du temps sans conflit et gère les comptes.</span></li>
        </ul>
        <p class="login-foot">Prototype du projet « Plateforme de services universitaires », 3 LSI 2.</p>
      </aside>
      <main class="login-main" id="main" tabindex="-1"><div class="login-box">
        <form id="lform" class="form" novalidate>
          <div><h2>Connexion</h2><p class="lede">Utilisez l’adresse e-mail fournie par la scolarité.</p></div>
          ${UI.field({ id: 'email', label: 'Adresse e-mail', input: '<input id="email" class="input" type="email" autocomplete="username" placeholder="prenom.nom@ums.test" spellcheck="false">' })}
          ${UI.field({ id: 'password', label: 'Mot de passe', input: `<div class="pw"><input id="password" class="input" type="password" autocomplete="current-password"><button type="button" class="ibtn" id="pw-t" aria-label="Afficher le mot de passe" aria-pressed="false">${U.icon('eye', 19)}</button></div>` })}
          <div id="lerr"></div>
          <button class="btn btn-p" type="submit" style="width:100%;height:44px">Se connecter</button>
        </form>
        <section class="demo" aria-labelledby="demo-h">
          <h3 id="demo-h">Comptes de démonstration</h3>
          <p class="small" style="margin-bottom:12px">Un clic pour entrer. Mot de passe commun : <b>${S.DEMO_PASSWORD}</b></p>
          ${DEMO.map(([e, u, r, d]) => `<button type="button" class="demo-acc" data-demo="${e}">${UI.avatar(u, 'av-ink')}<span class="t"><b>${esc(u.firstName + ' ' + u.lastName)}</b><span>${esc(r)}. ${esc(d)}.</span></span>${U.icon('chevR')}</button>`).join('')}
          <details class="guide"><summary>Que tester ? ${U.icon('chevD')}</summary><ol>
            <li><b>Scolarité</b> : dans l’emploi du temps, déplacez le TP de Big Data du jeudi. Essayez la salle B12 à 15:45 : le conflit est détecté et les salles libres sont proposées.</li>
            <li><b>Enseignante</b> : saisissez des notes (21 est refusé), publiez-les, puis faites l’appel de la séance du jour.</li>
            <li><b>Étudiante</b> : retrouvez la notification, la nouvelle note et l’absence.</li></ol></details>
          <p class="small" style="margin-top:16px">Vos modifications restent dans ce navigateur. <button type="button" class="link" data-act="reset">Réinitialiser les données</button></p>
        </section>
      </div></main></div>`;
  }

  function bindLogin() {
    const form = document.getElementById('lform');
    const pw = document.getElementById('password'), tg = document.getElementById('pw-t');
    tg.addEventListener('click', () => {
      const show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      tg.setAttribute('aria-pressed', String(show));
      tg.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
      tg.innerHTML = U.icon(show ? 'eyeOff' : 'eye', 19);
      pw.focus();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      if (!email) { UI.setErr(form, 'email', 'Indiquez votre adresse e-mail.'); return; }
      if (!pw.value) { UI.setErr(form, 'password', 'Indiquez votre mot de passe.'); return; }
      UI.setErr(form, null);
      if (!doLogin(email, pw.value))
        document.getElementById('lerr').innerHTML = UI.notice('bad', 'Connexion refusée', '<p>L’adresse e-mail ou le mot de passe ne correspond à aucun compte. Vérifiez-les, ou utilisez un compte de démonstration.</p>');
    });
    root.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => doLogin(b.dataset.demo, S.DEMO_PASSWORD)));
  }

  function doLogin(email, pass) {
    const u = S.login(email, pass);
    if (!u) return null;
    U.nav.week = 0; U.nav.day = null;
    location.hash = UI.home(u.role);
    return u;
  }

  let lastPath = null;
  function render(opts) {
    opts = opts || {};
    const y = window.scrollY;
    UI.closeAll();
    const user = S.currentUser();
    const hash = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = hash.split('?');
    const query = new URLSearchParams(qs || '');
    const routeChanged = path !== lastPath;
    lastPath = path;
    if (!user) {
      if (path !== '/connexion') { location.replace('#/connexion'); return; }
      root.innerHTML = loginView();
      document.title = 'Connexion · Services universitaires';
      bindLogin();
      return;
    }
    const parts = path.split('/').filter(Boolean);
    const base = UI.BASE[user.role];
    if (parts[0] !== base || !UI.NAV[user.role].some((n) => n[0] === parts[1])) { location.replace(UI.home(user.role)); return; }
    const view = U.views[user.role][parts[1]];
    root.innerHTML = UI.shell(user, parts[1], view.render(user, { query }));
    document.title = `${view.title} · Services universitaires`;
    const main = document.getElementById('main');
    if (view.bind) view.bind(main, user, { query });
    if (opts.keepScroll) window.scrollTo(0, y);
    else {
      window.scrollTo(0, 0);
      if (routeChanged && !document.querySelector('dialog[open]')) main.focus({ preventScroll: true });
    }
  }
  U.app = { render };

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'account') { const u = S.currentUser(); if (u) UI.account(u); return; }
    if (act === 'logout') { UI.closeAll(); S.logout(); location.hash = '#/connexion'; return; }
    if (act === 'reset') {
      UI.closeAll();
      const yes = await UI.confirm({ title: 'Réinitialiser les données ?', text: 'Les notes, appels, séances et comptes modifiés dans ce navigateur seront effacés, et les données de démonstration rechargées.', ok: 'Réinitialiser', danger: true });
      if (!yes) return;
      S.reset(); U.nav.week = 0; U.nav.day = null;
      render();
      U.toast('Données de démonstration réinitialisées.');
    }
  });
  window.addEventListener('hashchange', () => render());
  // L'éditeur de séance passe de tiroir à panneau latéral selon la largeur
  UI.wide.addEventListener('change', () => { if (/^#\/admin\/edt/.test(location.hash)) render({ keepScroll: true }); });
  S.init();
  render();
})();
