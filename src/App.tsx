import { useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import {
  Menu,
  X,
  Search,
  Github,
  Check,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Filter,
  Target,
  Crosshair,
  Send,
  Mail,
  RefreshCw,
  DollarSign,
  Briefcase,
  Sun,
  Moon,
} from 'lucide-react';
import { CATEGORIES, SESSIONS, TIERS, EXPERTS } from './data';
import type { Expert, CategoryId, SessionId, TierId } from './types';
import { HeroViz } from './HeroViz';

const GITHUB_URL = 'https://github.com/1nc0gn30/mentorship-marketplace';

function fmtFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

// Pull the live render of a section into view (works even under suppressed scroll APIs).
function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unstuck-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [session, setSession] = useState<SessionId | null>(null);
  const [tier, setTier] = useState<TierId | null>(null);
  const [openExpert, setOpenExpert] = useState<Expert | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [bookErr, setBookErr] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'tier' | 'priceAsc' | 'priceDesc'>('tier');
  const [intakeText, setIntakeText] = useState('');
  const [leadSent, setLeadSent] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyDone, setApplyDone] = useState(false);
  const [intakeSession, setIntakeSession] = useState<SessionId | null>(null);
  const [contactExpert, setContactExpert] = useState<Expert | null>(null);
  const [contactSent, setContactSent] = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const [updateDone, setUpdateDone] = useState(false);
  const [updateSending, setUpdateSending] = useState(false);
  const [updateExpertId, setUpdateExpertId] = useState<string>('');
  const onBookRef = useRef<() => void>(() => {});

  // Apply theme to document + persist
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('unstuck-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  onBookRef.current = () => {
    const m = openExpert;
    if (!m) return;
    setPending(m.id);
    setBookErr(null);
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expertId: m.id,
        expertName: m.name,
        amount: m.rate * 100, // dollars -> cents
        sessionId: m.sessions[0],
        sessionLabel: SESSIONS.find((s) => s.id === m.sessions[0])?.label,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setPending(null);
        if (data.url) {
          window.location.href = data.url; // real Stripe-hosted Payment Link (test mode)
        } else {
          setBookErr(data.error || 'Could not start checkout.');
        }
      })
      .catch((e) => {
        setPending(null);
        setBookErr('Network error: ' + e.message);
      });
  };

  // Netlify Forms submission (no backend needed — Netlify captures + emails).
  const submitNetlifyForm = async (formName: string, fields: Record<string, string>) => {
    const fd = new FormData();
    fd.append('form-name', formName);
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    await fetch('/', {
      method: 'POST',
      headers: { Accept: 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fd as any).toString(),
    });
  };

  const filtered = useMemo(() => {
    let list = EXPERTS.filter((m) => {
      if (category && !m.categories.includes(category)) return false;
      if (session && !m.sessions.includes(session)) return false;
      if (tier && m.tier !== tier) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${m.name} ${m.handle} ${m.bio} ${m.proof.join(' ')} ${m.outcomes.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const tierRank: Record<TierId, number> = { micro: 0, proven: 1, status: 2 };
    if (sortBy === 'tier') list = [...list].sort((a, b) => tierRank[a.tier] - tierRank[b.tier] || a.rate - b.rate);
    if (sortBy === 'priceAsc') list = [...list].sort((a, b) => a.rate - b.rate);
    if (sortBy === 'priceDesc') list = [...list].sort((a, b) => b.rate - a.rate);
    return list;
  }, [query, category, session, tier, sortBy]);

  const categoryCount = (id: CategoryId) => EXPERTS.filter((m) => m.categories.includes(id)).length;
  const sessionCount = (id: SessionId) => EXPERTS.filter((m) => m.sessions.includes(id)).length;

  const resetFilters = () => {
    setQuery('');
    setCategory(null);
    setSession(null);
    setTier(null);
  };

  const activeFilterCount =
    (category ? 1 : 0) + (session ? 1 : 0) + (tier ? 1 : 0) + (query ? 1 : 0);

  // Native delegated click handling attached at the DOCUMENT level, so it works
  // regardless of whether React's own synthetic event delegation is active.
  useEffect(() => {
    const onRootClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const contactBtn = target.closest<HTMLElement>('[data-contact]');
      if (contactBtn) {
        const id = contactBtn.getAttribute('data-contact')!;
        const m = EXPERTS.find((x) => x.id === id);
        if (m) { setContactSent(false); setContactExpert(m); }
        return;
      }

      const closeContact = target.closest<HTMLElement>('[data-close-contact]');
      if (closeContact) { setContactExpert(null); return; }

      const card = target.closest<HTMLElement>('[data-expert]');
      if (card) {
        const id = card.getAttribute('data-expert')!;
        const m = EXPERTS.find((x) => x.id === id);
        if (m) { setPending(null); setBookErr(null); setOpenExpert(m); }
        return;
      }

      const catBtn = target.closest<HTMLElement>('[data-category]');
      if (catBtn) {
        const id = catBtn.getAttribute('data-category') as CategoryId;
        setCategory((cur) => (cur === id ? null : id));
        return;
      }

      const sessBtn = target.closest<HTMLElement>('[data-session]');
      if (sessBtn) {
        const id = sessBtn.getAttribute('data-session') as SessionId;
        setSession((cur) => (cur === id ? null : id));
        scrollToId('experts');
        return;
      }

      const tierBtn = target.closest<HTMLElement>('[data-tier]');
      if (tierBtn) {
        const id = tierBtn.getAttribute('data-tier') as TierId;
        setTier((cur) => (cur === id ? null : id));
        return;
      }

      const intakeSess = target.closest<HTMLElement>('[data-intake-session]');
      if (intakeSess) {
        const id = intakeSess.getAttribute('data-intake-session') as SessionId;
        setIntakeSession((cur) => (cur === id ? null : id));
        return;
      }

      const findBtn = target.closest<HTMLElement>('[data-find]');
      if (findBtn) {
        // Manual matching: carry the chosen session into the expert filter, then scroll.
        if (intakeSession) setSession(intakeSession);
        // Capture the lead via Netlify Forms (name/email optional in a later step).
        submitNetlifyForm('lead', {
          stuck: intakeText,
          session: intakeSession ? SESSIONS.find((s) => s.id === intakeSession)?.label || '' : '',
          name: '',
          email: '',
        }).catch(() => {});
        setLeadSent(true);
        scrollToId('experts');
        return;
      }

      const hamburger = target.closest<HTMLElement>('[data-hamburger]');
      if (hamburger) { setDrawerOpen((v) => !v); return; }

      const bookBtn = target.closest<HTMLElement>('[data-book]');
      if (bookBtn) { onBookRef.current(); return; }

      const closeBooking = target.closest<HTMLElement>('[data-close-booking]');
      if (closeBooking || target.classList.contains('drawer-scrim')) { setOpenExpert(null); return; }

      const drawerLink = target.closest<HTMLElement>('[data-close-drawer]');
      if (drawerLink) { setDrawerOpen(false); return; }

      const clear = target.closest<HTMLElement>('[data-clear]');
      if (clear) { resetFilters(); return; }
    };
    document.addEventListener('click', onRootClick);
    const onInput = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.matches('[data-search]')) setQuery((t as HTMLInputElement).value);
      else if (t.matches('[data-intake]')) setIntakeText((t as HTMLTextAreaElement).value);
      else if (t.matches('[data-sort]')) setSortBy((t as HTMLSelectElement).value as typeof sortBy);
    };
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    return () => {
      document.removeEventListener('click', onRootClick);
      document.removeEventListener('input', onInput);
      document.removeEventListener('change', onInput);
    };
  }, [intakeSession, contactExpert]);

  // Scroll-reveal + active nav highlighting (does not touch click delegation).
  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>('.reveal');
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach((el) => ro.observe(el));

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]'));
    const sections = links
      .map((l) => document.getElementById(l.getAttribute('href')!.slice(1)))
      .filter(Boolean) as HTMLElement[];
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => navObserver.observe(s));

    return () => { ro.disconnect(); navObserver.disconnect(); };
  }, []);

  return (
    <div className="app">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="grid-bg" />

      {/* NAV */}
      <header className="nav">
        <a className="brand" href="#top" data-close-drawer>
          <span className="brand-mark">✶</span>
          <span className="brand-name">Unstuck</span>
        </a>

        <nav className="nav-links">
          <a href="#intake">Get matched</a>
          <a href="#categories">Wedges</a>
          <a href="#sessions">Sessions</a>
          <a href="#experts">Experts</a>
          <a href="#how">How it works</a>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a className="nav-cta" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <Github size={15} /> Star
          </a>
        </nav>

        <button className="theme-toggle mobile-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button className="hamburger" data-hamburger aria-label="Open menu">
          <Menu size={22} />
        </button>
      </header>

      {/* MOBILE DRAWER */}
      <div className={`drawer-scrim ${drawerOpen ? 'show' : ''}`} />
      <aside className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <a href="#intake" data-close-drawer>Get matched</a>
        <a href="#categories" data-close-drawer>Wedges</a>
        <a href="#sessions" data-close-drawer>Sessions</a>
        <a href="#experts" data-close-drawer>Experts</a>
        <a href="#how" data-close-drawer>How it works</a>
        <a href="#update" data-close-drawer>Update your card</a>
        <div className="drawer-theme-row">
          <span>Appearance</span>
          <button className="drawer-theme-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
        <a className="drawer-cta" href={GITHUB_URL} target="_blank" rel="noreferrer" data-close-drawer>
          <Github size={15} /> Star on GitHub
        </a>
      </aside>

      {/* HERO */}
      <section className="hero" id="top">
        <div className="hero-glass">
          <div className="hero-glow" />
          <HeroViz theme={theme} />
          <div className="kicker">
            <span className="kicker-dot" /> tactical office hours with proven builders, marketers & operators
          </div>
          <h1 className="hero-title">
            Get <span className="grad grad-anim">unstuck</span> in one call.
          </h1>
          <p className="hero-sub">
            Book a working session with someone who has <span className="hl">already solved the exact problem</span> you're
            stuck on. No generic advice, no guru energy — just a 30-minute session on a real outcome.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#intake">Tell us what you're stuck on</a>
            <a className="btn btn-ghost" href="#sessions">See the sessions</a>
          </div>
          <div className="hero-stats">
            <div><strong>{EXPERTS.length}</strong><span>vetted experts</span></div>
            <div><strong>{CATEGORIES.length}</strong><span>narrow wedges</span></div>
            <div><strong>{SESSIONS.length}</strong><span>session types</span></div>
          </div>
        </div>
      </section>

      {/* LIVE PROOF TICKER */}
      <div className="ticker">
        <div className="ticker-inner">
          <span className="ticker-label">Live</span>
          <div className="ticker-track">
            <span className="ticker-anim">
              {EXPERTS.map((m) => (
                <span key={m.id}><span className="dot">●</span> {m.name} · {m.handle} · ${m.rate}</span>
              ))}
              {EXPERTS.map((m) => (
                <span key={`r-${m.id}`} aria-hidden><span className="dot">●</span> {m.name} · {m.handle} · ${m.rate}</span>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* INTAKE — the MVP mechanic */}
      <section className="section reveal" id="intake">
        <div className="section-head">
          <h2>Tell us what you're <span className="grad">stuck on</span></h2>
          <p>We'll match you with the right builder for a 30-minute working session. Start manually — pick the closest session, or just describe it.</p>
        </div>
        <div className="intake-glass">
          <div className="intake-row">
            {SESSIONS.map((s) => (
              <button
                key={s.id}
                data-intake-session={s.id}
                className={`intake-chip ${intakeSession === s.id ? 'active' : ''}`}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
          <textarea
            data-intake
            className="intake-text"
            rows={3}
            placeholder="e.g. 'My SaaS landing page gets traffic but nobody signs up — and I can't tell if the idea is even worth it.'"
            value={intakeText}
            onChange={(e) => setIntakeText(e.target.value)}
          />
          <div className="intake-foot">
            {leadSent ? (
              <span className="intake-hint"><span className="kicker-dot" /> Lead captured — we'll match you. Browse experts below ↓</span>
            ) : (
              <span className="intake-hint">{intakeText.trim() ? 'Got it — ' : ''}matching is manual for now, but real.</span>
            )}
            <button className="btn btn-primary" data-find>
              <Crosshair size={16} /> Find my expert
            </button>
          </div>
        </div>
      </section>

      {/* CATEGORIES — the 3 narrow wedges */}
      <section className="section reveal" id="categories">
        <div className="section-head">
          <h2>Start <span className="grad">narrow</span></h2>
          <p>Three wedges we go deep on. Trust + specificity, not a giant open directory.</p>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <div key={c.id} className="cat-card" style={{ ['--accent' as string]: c.accent }}>
              <div className="cat-emoji">{c.emoji}</div>
              <h3>{c.label}</h3>
              <p>{c.blurb}</p>
              <div className="cat-count">{categoryCount(c.id)} experts</div>
            </div>
          ))}
        </div>
      </section>

      {/* SESSIONS — productized outcomes */}
      <section className="section reveal" id="sessions">
        <div className="section-head">
          <h2>Every session is a <span className="grad">product</span></h2>
          <p>Pick the outcome you need. Each is a 30-minute working session with a real deliverable afterward.</p>
        </div>
        <div className="session-grid">
          {SESSIONS.map((s) => (
            <button
              key={s.id}
              data-session={s.id}
              className={`session-card ${session === s.id ? 'active' : ''}`}
            >
              <div className="session-emoji">{s.emoji}</div>
              <div className="session-body">
                <h4>{s.label}</h4>
                <p>{s.blurb}</p>
              </div>
              <div className="session-foot">
                <span className="session-count">{sessionCount(s.id)} experts</span>
                <span className="session-go">Find →</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* EXPERTS */}
      <section className="section reveal" id="experts">
        <div className="section-head">
          <h2>Vetted <span className="grad">experts</span></h2>
          <p>Proof of work, real audience or traction, a clear niche. No "make $10K/month" gurus.</p>
        </div>

        <div className="controls">
          <div className="search-wrap">
            <Search size={16} className="search-ico" />
            <input
              data-search
              className="search"
              placeholder="Search by name, skill, or proof…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="sort-wrap">
            <Filter size={15} />
            <select data-sort value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="tier">Sort: Tier</option>
              <option value="priceAsc">Price: Low → High</option>
              <option value="priceDesc">Price: High → Low</option>
            </select>
          </div>
        </div>

        <div className="chips">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              data-category={c.id}
              className={`chip ${category === c.id ? 'active' : ''}`}
              style={{ ['--accent' as string]: c.accent }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <div className="chips price-chips">
          {TIERS.map((t) => (
            <button
              key={t.id}
              data-tier={t.id}
              className={`chip ${tier === t.id ? 'active' : ''}`}
              style={{ ['--accent' as string]: t.accent }}
            >
              {t.emoji} {t.label} · ${t.priceFrom}{t.priceTo ? `–$${t.priceTo}` : '+'}
            </button>
          ))}
        </div>

        {(activeFilterCount > 0) && (
          <div className="filter-bar">
            <span>Showing {filtered.length} expert{filtered.length !== 1 ? 's' : ''}</span>
            <button className="clear-btn" data-clear>Clear filters ✕</button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty">
            <Sparkles size={28} />
            <p>No experts match yet. Try clearing a filter.</p>
            <button className="btn btn-ghost" onClick={resetFilters}>Reset</button>
          </div>
        ) : (
          <div className="expert-grid">
            {filtered.map((m) => (
              <ExpertCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      {/* VETTING — the differentiation */}
      <section className="section reveal" id="vetting">
        <div className="section-head">
          <h2>We vet for <span className="grad">proof</span>, not polish</h2>
          <p>Our moat is trust + specificity. Every expert clears the same bar.</p>
        </div>
        <div className="vet-grid">
          {[
            { icon: '🛠️', t: 'Proof of work', d: 'Real shipped products, launches, or audience — not a course they sell you.' },
            { icon: '📣', t: 'Real audience or traction', d: 'They have done the thing in public, with numbers to show for it.' },
            { icon: '🎯', t: 'Clear niche skill', d: 'One or two things they are genuinely the right person for.' },
            { icon: '✅', t: 'Specific outcomes', d: 'They can name exactly what you will leave the call with.' },
            { icon: '🚫', t: 'No guru energy', d: 'No fake income screenshots, no guaranteed-results promises.' },
            { icon: '🤝', t: 'Builders helping builders', d: 'Operators one or ten steps ahead — not professional coaches.' },
          ].map((v) => (
            <div key={v.t} className="vet-card">
              <div className="vet-icon">{v.icon}</div>
              <h4>{v.t}</h4>
              <p>{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS — productized session flow */}
      <section className="section reveal" id="how">
        <div className="section-head">
          <h2>How a <span className="grad">session</span> works</h2>
          <p>Every call is a product, not a random chat. Five steps, end to end.</p>
        </div>
        <div className="steps">
          <div className="step"><div className="step-num">1</div><h3>Pre-call intake</h3><p>Tell us what you're stuck on and we match you with the right builder.</p></div>
          <div className="step"><div className="step-num">2</div><h3>AI-generated brief</h3><p>We hand your expert a short brief so the 30 minutes go straight at your problem.</p></div>
          <div className="step"><div className="step-num">3</div><h3>30-min working session</h3><p>A live, tactical call — teardown, plan, or audit you can act on immediately.</p></div>
          <div className="step"><div className="step-num">4</div><h3>Post-call action plan</h3><p>You leave with a written plan of the exact next moves, in order.</p></div>
          <div className="step"><div className="step-num">5</div><h3>Templates & resources</h3><p>We send the frameworks, checklists, and templates from the call.</p></div>
        </div>
      </section>

      {/* EXPERT SELF-UPDATE — listed experts can update their info */}
      <section className="section reveal" id="update">
        <div className="section-head">
          <h2>Already listed? <span className="grad">Update your card</span></h2>
          <p>Change your rate, bio, available sessions, or pause your listing. We review changes before they go live.</p>
        </div>
        <div className="update-glass">
          {updateDone ? (
            <div className="update-success">
              <div className="check-circle"><Check size={28} /></div>
              <h3>Update received</h3>
              <p>We'll review your changes and push them live within 24 hours. You'll get a confirmation at the email you provided.</p>
              <button className="btn btn-ghost" onClick={() => { setUpdateDone(false); setUpdateExpertId(''); }}>Submit another update</button>
            </div>
          ) : (
            <form
              className="update-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = e.currentTarget;
                const expert = EXPERTS.find((x) => x.id === updateExpertId);
                setUpdateSending(true);
                submitNetlifyForm('expert-update', {
                  expertName: expert?.name || '',
                  expertHandle: expert?.handle || '',
                  email: (f.elements.namedItem('email') as HTMLInputElement).value,
                  newRate: (f.elements.namedItem('newRate') as HTMLInputElement).value,
                  newBio: (f.elements.namedItem('newBio') as HTMLTextAreaElement).value,
                  sessions: Array.from(f.querySelectorAll('input[name="sessions"]:checked'))
                    .map((cb) => (cb as HTMLInputElement).value).join(', '),
                  availability: (f.elements.namedItem('availability') as HTMLSelectElement).value,
                  notes: (f.elements.namedItem('notes') as HTMLTextAreaElement).value,
                })
                  .then(() => { setUpdateDone(true); setUpdateSending(false); })
                  .catch(() => { setUpdateDone(true); setUpdateSending(false); });
              }}
            >
              <div className="update-row">
                <label className="update-label">
                  <span><Briefcase size={13} /> Who are you?</span>
                  <select
                    name="expertId"
                    value={updateExpertId}
                    onChange={(e) => setUpdateExpertId(e.target.value)}
                    required
                  >
                    <option value="">Select your name...</option>
                    {EXPERTS.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.handle})</option>
                    ))}
                  </select>
                </label>
                <label className="update-label">
                  <span><Mail size={13} /> Your email</span>
                  <input name="email" type="email" placeholder="you@example.com" required />
                </label>
              </div>

              {updateExpertId && (() => {
                const m = EXPERTS.find((x) => x.id === updateExpertId)!;
                return (
                  <div className="update-current">
                    <img src={m.avatar} alt={m.name} />
                    <div>
                      <strong>{m.name}</strong>
                      <span>Current rate: ${m.rate} · {m.sessions.length} sessions · {m.tier}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="update-row">
                <label className="update-label">
                  <span><DollarSign size={13} /> New rate ($)</span>
                  <input name="newRate" type="number" min="10" max="1000" placeholder="e.g. 99" />
                </label>
                <label className="update-label">
                  <span><RefreshCw size={13} /> Availability</span>
                  <select name="availability" defaultValue="available">
                    <option value="available">Available for sessions</option>
                    <option value="limited">Limited — a few slots left</option>
                    <option value="paused">Pause my listing temporarily</option>
                    <option value="remove">Remove me from the marketplace</option>
                  </select>
                </label>
              </div>

              <label className="update-label">
                <span>Updated bio (one paragraph)</span>
                <textarea name="newBio" rows={3} placeholder="Keep it short — what you do, who you help, proof of work." />
              </label>

              <div className="update-label">
                <span>Sessions you offer</span>
                <div className="update-sessions">
                  {SESSIONS.map((s) => {
                    const expert = EXPERTS.find((x) => x.id === updateExpertId);
                    const checked = expert?.sessions.includes(s.id);
                    return (
                      <label key={s.id} className={`update-check ${checked ? 'pre-checked' : ''}`}>
                        <input type="checkbox" name="sessions" value={s.label} defaultChecked={checked} />
                        {s.emoji} {s.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="update-label">
                <span>Anything else we should know?</span>
                <textarea name="notes" rows={2} placeholder="Updated proof links, new outcomes, schedule changes, etc." />
              </label>

              <div className="update-actions">
                <button type="submit" className="btn btn-primary" disabled={updateSending}>
                  <RefreshCw size={15} /> {updateSending ? 'Sending...' : 'Submit update'}
                </button>
              </div>
              <p className="update-note">Changes are reviewed before going live. We'll email you when your card is updated.</p>
            </form>
          )}
        </div>
      </section>

      {/* SUPPLY CTA — become an expert */}
      <section className="section become reveal">
        <div className="become-glass">
          <div>
            <h2>Got proof of work? <span className="grad">Become an expert</span></h2>
            <p>A managed niche marketplace — we don't let anyone list themselves. Show us the work, pass vetting, and we match you with founders who are stuck on exactly your thing. Manual matching + Stripe to start.</p>
            <span className="become-note">Concept — expert applications open soon. No guru energy, ever.</span>
          </div>
          {applyDone ? (
            <div className="apply-done">✓ Application received — we'll review your proof of work.</div>
          ) : applyOpen ? (
            <form
              className="apply-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = e.currentTarget;
                submitNetlifyForm('apply', {
                  name: (f.elements.namedItem('name') as HTMLInputElement).value,
                  email: (f.elements.namedItem('email') as HTMLInputElement).value,
                  xHandle: (f.elements.namedItem('xHandle') as HTMLInputElement).value,
                  proof: (f.elements.namedItem('proof') as HTMLInputElement).value,
                  niche: (f.elements.namedItem('niche') as HTMLInputElement).value,
                  message: (f.elements.namedItem('message') as HTMLTextAreaElement).value,
                })
                  .then(() => setApplyDone(true))
                  .catch(() => setApplyDone(true));
              }}
            >
              <input name="name" placeholder="Your name" required />
              <input name="email" type="email" placeholder="Email" required />
              <input name="xHandle" placeholder="X / social handle" />
              <input name="proof" placeholder="Link to proof of work" />
              <input name="niche" placeholder="Your one niche skill" />
              <textarea name="message" rows={2} placeholder="One line on what you'd help founders with" />
              <div className="apply-actions">
                <button type="submit" className="btn btn-primary">Submit application →</button>
                <button type="button" className="btn btn-ghost" onClick={() => setApplyOpen(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button className="btn btn-primary" onClick={() => setApplyOpen(true)}>Apply to join →</button>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="brand"><span className="brand-mark">✶</span><span className="brand-name">Unstuck</span></div>
            <p className="footer-tag">Tactical office hours with proven builders, marketers, and operators.</p>
          </div>
          <div className="footer-links">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a>
            <a href="#experts">Browse experts</a>
            <a href="#sessions">Session types</a>
            <a href="#how">How it works</a>
          </div>
        </div>
        <div className="footer-note">
          A concept marketplace — seed experts drawn from the CreatorPlaybooks builder network. Managed niche marketplace first, not an open platform. Payments run through Stripe Payment Links (test mode) with signed webhooks.
        </div>
      </footer>

      {/* BOOKING DRAWER */}
      {openExpert && (
        <BookingDrawer
          m={openExpert}
          pending={pending === openExpert.id}
          bookErr={pending === openExpert.id ? null : bookErr}
          onBook={onBookRef.current}
        />
      )}

      {/* CONTACT MODAL */}
      {contactExpert && (
        <ContactModal
          m={contactExpert}
          sent={contactSent}
          sending={contactSending}
          onSubmit={async (fields) => {
            setContactSending(true);
            try {
              await submitNetlifyForm('expert-contact', {
                expertName: contactExpert.name,
                expertHandle: contactExpert.handle,
                ...fields,
              });
              setContactSent(true);
            } catch {
              setContactSent(true);
            }
            setContactSending(false);
          }}
        />
      )}
    </div>
  );
}

function ExpertCard({ m }: { m: Expert }) {
  const tierMeta = TIERS.find((t) => t.id === m.tier)!;
  const isTop = m.tier === 'status';
  return (
    <article
      data-expert={m.id}
      className={`card${isTop ? ' card-top-tier' : ''}`}
      style={{ ['--accent' as string]: tierMeta.accent }}
    >
      {isTop && <span className="top-ribbon">★ Top tier</span>}
      <div className="card-top">
        <div className="avatar-wrap">
          <img src={m.avatar} alt={m.name} loading="lazy" />
          <span className="tier-badge">{tierMeta.emoji} {tierMeta.label}</span>
        </div>
        <div className="card-id">
          <h3>{m.name}</h3>
          <a className="handle" href={`https://x.com/${m.xHandle}`} target="_blank" rel="noreferrer">
            {m.handle} <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
      <p className="card-bio">{m.bio}</p>
      <div className="card-tags">
        {m.sessions.slice(0, 3).map((s) => {
          const sess = SESSIONS.find((x) => x.id === s)!;
          return <span key={s} className="tag">{sess.emoji} {sess.label}</span>;
        })}
        {m.sessions.length > 3 && <span className="tag tag-more">+{m.sessions.length - 3} more</span>}
      </div>
      <div className="card-foot">
        <div className="rate">
          <span className="rate-price">${m.rate}</span>
          <span className="rate-note">{m.rateNote}</span>
        </div>
        <div className="card-cta">Book →</div>
      </div>
      <button
        className="contact-btn-card"
        data-contact={m.id}
      >
        <Mail size={13} /> Contact
      </button>
    </article>
  );
}

const BookingDrawer = forwardRef<HTMLDivElement, {
  m: Expert;
  pending: boolean;
  bookErr: string | null;
  onBook: () => void;
}>(function BookingDrawer({ m, pending, bookErr, onBook }, ref) {
  const tierMeta = TIERS.find((t) => t.id === m.tier)!;
  return (
    <div ref={ref}>
      <div className="drawer-scrim show" />
      <aside className="booking" style={{ ['--accent' as string]: tierMeta.accent }}>
        <button className="booking-close" data-close-booking aria-label="Close"><X size={20} /></button>
        <div className="booking-head">
          <img className="booking-avatar" src={m.avatar} alt={m.name} />
          <div>
            <h2>{m.name}</h2>
            <a className="handle" href={`https://x.com/${m.xHandle}`} target="_blank" rel="noreferrer">
              {m.handle} <ArrowUpRight size={12} />
            </a>
            <div className="booking-tier">{tierMeta.emoji} {tierMeta.label} · {fmtFollowers(m.followers)} followers</div>
          </div>
        </div>

        <p className="booking-bio">{m.bio}</p>

        <div className="booking-price">
          <div>
            <div className="bp-amt">${m.rate}</div>
            <div className="bp-note">{m.rateNote}</div>
          </div>
          <span className="bp-per">{tierMeta.emoji} {tierMeta.label}</span>
        </div>

        <h4>Proof of work</h4>
        <ul className="strengths">
          {m.proof.map((s) => (
            <li key={s}><Check size={14} /> {s}</li>
          ))}
        </ul>

        <h4>What you'll leave with</h4>
        <ul className="strengths outcomes">
          {m.outcomes.map((s) => (
            <li key={s}><Target size={14} /> {s}</li>
          ))}
        </ul>

        <h4>Sessions they run</h4>
        <div className="booking-topics">
          {m.sessions.map((s) => {
            const sess = SESSIONS.find((x) => x.id === s)!;
            return <span key={s} className="tag">{sess.emoji} {sess.label}</span>;
          })}
        </div>

        {pending ? (
          <button className="btn btn-primary book-btn" disabled>
            <Calendar size={16} /> Starting checkout… <span className="book-btn-demo">test</span>
          </button>
        ) : (
          <button className="btn btn-primary book-btn" data-book onClick={onBook}>
            <Calendar size={16} /> Book a session · ${m.rate}
            <span className="book-btn-demo">test</span>
          </button>
        )}
        <button
          className="btn btn-ghost contact-btn-drawer"
          data-contact={m.id}
        >
          <Mail size={15} /> Send a message instead
        </button>
        {bookErr && (
          <div className="booked book-err">
            <span>{bookErr}</span>
            <div className="booked-note">Payment Links are created in Stripe test mode. Make sure the API server is running.</div>
          </div>
        )}
      </aside>
    </div>
  );
});

function ContactModal({
  m,
  sent,
  sending,
  onSubmit,
}: {
  m: Expert;
  sent: boolean;
  sending: boolean;
  onSubmit: (fields: Record<string, string>) => Promise<void>;
}) {
  return (
    <div className="contact-modal" data-close-contact>
      <div className="contact-box">
        <button className="contact-close" data-close-contact aria-label="Close">
          <X size={20} />
        </button>

        {sent ? (
          <div className="contact-success">
            <div className="check-circle"><Check size={28} /></div>
            <h3>Message sent to {m.name}</h3>
            <p>We received your message and will pass it along. {m.name.split(' ')[0]} will get back to you at the email you provided.</p>
            <button className="contact-btn-secondary" data-close-contact>Done</button>
          </div>
        ) : (
          <>
            <div className="contact-head">
              <img src={m.avatar} alt={m.name} />
              <div>
                <h3>Contact {m.name}</h3>
                <a className="handle" href={`https://x.com/${m.xHandle}`} target="_blank" rel="noreferrer">
                  {m.handle} <ArrowUpRight size={12} />
                </a>
              </div>
            </div>

            <form
              className="contact-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = e.currentTarget;
                onSubmit({
                  name: (f.elements.namedItem('name') as HTMLInputElement).value,
                  email: (f.elements.namedItem('email') as HTMLInputElement).value,
                  session: (f.elements.namedItem('session') as HTMLSelectElement).value,
                  message: (f.elements.namedItem('message') as HTMLTextAreaElement).value,
                });
              }}
            >
              <div className="contact-row">
                <label>
                  <span>Your name</span>
                  <input name="name" placeholder="Jane Doe" required />
                </label>
                <label>
                  <span>Email</span>
                  <input name="email" type="email" placeholder="jane@example.com" required />
                </label>
              </div>
              <label>
                <span>Which session are you interested in?</span>
                <div className="sort-wrap" style={{ width: '100%' }}>
                  <select name="session" defaultValue={m.sessions[0]}>
                    {m.sessions.map((s) => {
                      const sess = SESSIONS.find((x) => x.id === s)!;
                      return <option key={s} value={sess.label}>{sess.emoji} {sess.label}</option>;
                    })}
                    <option value="Not sure yet">Not sure yet</option>
                  </select>
                </div>
              </label>
              <label>
                <span>What do you need help with?</span>
                <textarea name="message" rows={4} placeholder={`Tell ${m.name.split(' ')[0]} what you're stuck on...`} required />
              </label>
              <div className="contact-actions">
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  <Send size={15} /> {sending ? 'Sending…' : 'Send message'}
                </button>
                <button type="button" className="contact-btn-secondary" data-close-contact>
                  Cancel
                </button>
              </div>
              <p className="contact-send-note">
                Your message goes to {m.name}'s inbox via our system. No spam, no sharing.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
