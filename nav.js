/**
 * LOWI — Shared Navigation Component
 * Inject this script at the very top of <body> on every page.
 * For pages with custom right-slot content (e.g. pitch), define
 * window.__NAV_RIGHT__ as an HTML string before loading this script.
 */
(function () {
  /* ── CSS ── */
  const CSS = `
nav.lowi-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 400;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 4vw; height: 62px;
  background: rgba(242,237,226,.92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(201,168,76,.2);
  box-sizing: border-box;
}
.lowi-nav .nav-logo {
  font-family: 'MCTen', 'Cormorant', Georgia, serif;
  font-size: 1.8rem; font-weight: 400; letter-spacing: .02em;
  color: var(--ink, #1A1A2E); line-height: 1;
  text-decoration: none; display: flex; align-items: baseline; gap: 4px;
  flex-shrink: 0;
}
.lowi-nav .nav-logo-demo {
  font-size: .42em; color: #ff1a1a; letter-spacing: .01em;
  vertical-align: super; font-family: inherit;
}
.lowi-nav .nav-links {
  list-style: none; display: flex; gap: 2rem; margin: 0; padding: 0;
}
.lowi-nav .nav-links a {
  text-decoration: none; color: var(--ink2, #2E2E4A);
  font-size: .88rem; font-weight: 500; transition: color .2s;
  white-space: nowrap;
}
.lowi-nav .nav-links a:hover,
.lowi-nav .nav-links a.active { color: var(--gold, #C9A84C); }
.lowi-nav .nav-right {
  display: flex; align-items: center; gap: 10px; flex-shrink: 0;
}
/* Standard CTA button */
.lowi-nav .nav-cta {
  background: var(--gold, #C9A84C); color: var(--ink, #1A1A2E);
  border: none; cursor: pointer;
  padding: .55rem 1.4rem; border-radius: 2rem;
  font-weight: 700; font-size: .88rem;
  transition: background .2s, transform .15s;
  text-decoration: none; display: inline-flex; align-items: center;
  white-space: nowrap; font-family: inherit;
}
.lowi-nav .nav-cta:hover { background: var(--gold-lt, #E8C97A); transform: translateY(-1px); }
/* Language toggle (generic, used by all pages) */
.lowi-nav .nav-lang-btn {
  background: transparent; border: 1.5px solid rgba(0,0,0,.18);
  color: var(--ink2, #2E2E4A); padding: .42rem .95rem;
  border-radius: 2rem; font-weight: 700; font-size: .82rem;
  cursor: pointer; letter-spacing: .06em;
  transition: border-color .2s, color .2s, background .2s;
  font-family: inherit;
}
.lowi-nav .nav-lang-btn:hover,
.lowi-nav .nav-lang-btn.on {
  background: var(--gold, #C9A84C); color: var(--ink, #1A1A2E);
  border-color: var(--gold, #C9A84C);
}
/* Profile button */
.lowi-nav .nav-profile-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent;
  border: 1.5px solid rgba(0,0,0,.18);
  color: var(--ink2, #2E2E4A);
  padding: .42rem .9rem;
  border-radius: 2rem;
  font-weight: 600; font-size: .88rem;
  cursor: pointer; text-decoration: none;
  transition: border-color .2s, background .2s;
  font-family: inherit; white-space: nowrap;
}
.lowi-nav .nav-profile-btn:hover {
  background: rgba(201,168,76,.12);
  border-color: var(--gold, #C9A84C);
  color: var(--ink, #1A1A2E);
}
/* Pitch-specific badge */
.lowi-nav .nav-badge {
  font-size: .68rem; letter-spacing: .14em; text-transform: uppercase;
  padding: 4px 12px;
  background: rgba(201,168,76,.1); border: 1px solid rgba(201,168,76,.3);
  color: var(--gold, #C9A84C); border-radius: 2rem;
  font-weight: 600; white-space: nowrap;
  font-family: inherit;
}
/* Inline lang switcher (pitch / tech) */
.lowi-nav .nav-lang-inline {
  display: flex; border: 1.5px solid rgba(201,168,76,.3);
  border-radius: 6px; overflow: hidden;
}
.lowi-nav .nav-lang-inline button {
  font-family: inherit;
  font-size: .72rem; font-weight: 700; letter-spacing: .12em;
  padding: 5px 12px; cursor: pointer;
  background: transparent; border: none;
  color: var(--muted, #6B7280); transition: all .2s;
  text-transform: uppercase;
}
.lowi-nav .nav-lang-inline button.on {
  background: var(--gold, #C9A84C); color: var(--ink, #1A1A2E);
}
/* Responsive */
@media (max-width: 1024px) {
  .lowi-nav .nav-links { display: none; }
}
@media (max-width: 640px) {
  .lowi-nav { padding: 0 5vw; }
}
`;

  /* ── HTML ── */
  const rightSlot = window.__NAV_RIGHT__ || '';

  const HTML = `
<nav class="lowi-nav" id="lowi-nav">
  <a href="index.html" class="nav-logo">lowi<span class="nav-logo-demo"> - demo</span></a>
  <ul class="nav-links">
    <li><a href="comment-ca-marche.html" id="nav-how">Comment ça marche</a></li>
    <li><a href="a-propos.html" id="nav-about">À propos</a></li>
    <li><a href="projets.html" id="nav-projects">Voir les propriétés</a></li>
    <li><a href="proposer.html" id="nav-propose">Proposer votre bien</a></li>
  </ul>
  <div class="nav-right">${rightSlot}</div>
</nav>`;

  /* ── Inject style ── */
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  /* ── Inject nav ── */
  const tmp = document.createElement('div');
  tmp.innerHTML = HTML.trim();
  const navEl = tmp.firstElementChild;
  document.body.insertBefore(navEl, document.body.firstChild);

  /* ── Inject "Mon profil" button (always, after page-specific slot) ── */
  const _personIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
  const _loginBase  = 'https://lowi-dashboard.vercel.app/invest/login';
  const _back       = encodeURIComponent(window.location.href);
  const _profileBtn = document.createElement('a');
  _profileBtn.href  = _loginBase + '?redirect=' + _back;
  _profileBtn.className = 'nav-profile-btn';
  _profileBtn.innerHTML = _personIcon + ' Mon profil';
  navEl.querySelector('.nav-right').appendChild(_profileBtn);

  /* ── Active link ── */
  const page = location.pathname.split('/').pop() || 'index.html';
  navEl.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  /* ── Image protection : no right-click ── */
  document.addEventListener('contextmenu', function (e) {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

  /* ── Copy-paste attribution ── */
  document.addEventListener('copy', function () {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    setTimeout(function () {
      const text = sel.toString();
      if (!text) return;
      try {
        navigator.clipboard.writeText(
          text + '\n\n— Contenu issu de LOWI, la plateforme d\'investissement immobilier fractionné en Thaïlande. lowi.immo'
        );
      } catch (_) { /* clipboard API non disponible */ }
    }, 0);
  });
})();
