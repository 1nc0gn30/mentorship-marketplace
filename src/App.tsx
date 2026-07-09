import { useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import {
  Menu,
  X,
  Search,
  Star,
  Github,
  Check,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Filter,
} from 'lucide-react';
import { TIERS, TOPICS, MENTORS } from './data';
import type { Mentor, TierId, TopicId } from './types';

const GITHUB_URL = 'https://github.com/1nc0gn30/mentorship-marketplace';

function fmtFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function priceLabel(rate: number, note: string): string {
  return `$${rate}${note.replace('per', '/')}`;
}

export function App() {
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<TierId | null>(null);
  const [topic, setTopic] = useState<TopicId | null>(null);
  const [openMentor, setOpenMentor] = useState<Mentor | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [booked, setBooked] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'tier' | 'priceAsc' | 'priceDesc'>('tier');
  const [priceBand, setPriceBand] = useState<'all' | 'budget' | 'mid' | 'premium'>('all');

  // Refs for native event wiring (environment-safe: works even if React synthetic
  // event delegation is suppressed by the host browser).
  const onBookRef = useRef<() => void>(() => {});

  const filtered = useMemo(() => {
    let list = MENTORS.filter((m) => {
      if (tier && m.tier !== tier) return false;
      if (topic && !m.topics.includes(topic)) return false;
      if (priceBand === 'budget' && m.rate > 29) return false;
      if (priceBand === 'mid' && (m.rate < 30 || m.rate > 149)) return false;
      if (priceBand === 'premium' && m.rate < 150) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${m.name} ${m.handle} ${m.bio} ${m.strengths.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const tierRank: Record<TierId, number> = { rise: 0, build: 1, scale: 2 };
    if (sortBy === 'tier') list = [...list].sort((a, b) => tierRank[a.tier] - tierRank[b.tier] || a.rate - b.rate);
    if (sortBy === 'priceAsc') list = [...list].sort((a, b) => a.rate - b.rate);
    if (sortBy === 'priceDesc') list = [...list].sort((a, b) => b.rate - a.rate);
    return list;
  }, [query, tier, topic, priceBand, sortBy]);

  const tierCount = (id: TierId) => MENTORS.filter((m) => m.tier === id).length;
  const topicCount = (id: TopicId) => MENTORS.filter((m) => m.topics.includes(id)).length;

  const resetFilters = () => {
    setQuery('');
    setTier(null);
    setTopic(null);
    setPriceBand('all');
  };

  const activeFilterCount = (tier ? 1 : 0) + (topic ? 1 : 0) + (query ? 1 : 0) + (priceBand !== 'all' ? 1 : 0);

  // Native delegated click handling attached at the DOCUMENT level, so it works
  // regardless of whether React's own synthetic event delegation is active.
  useEffect(() => {
    const onRootClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const card = target.closest<HTMLElement>('[data-mentor]');
      if (card) {
        const id = card.getAttribute('data-mentor')!;
        const m = MENTORS.find((x) => x.id === id);
        if (m) { setBooked(null); setOpenMentor(m); }
        return;
      }

      const tierBtn = target.closest<HTMLElement>('[data-tier]');
      if (tierBtn) {
        const id = tierBtn.getAttribute('data-tier') as TierId;
        setTier((cur) => (cur === id ? null : id));
        return;
      }

      const chip = target.closest<HTMLElement>('[data-topic]');
      if (chip) {
        const id = chip.getAttribute('data-topic') as TopicId;
        setTopic((cur) => (cur === id ? null : id));
        return;
      }

      const priceChip = target.closest<HTMLElement>('[data-price]');
      if (priceChip) {
        const id = priceChip.getAttribute('data-price') as 'all' | 'budget' | 'mid' | 'premium';
        setPriceBand((cur) => (cur === id ? 'all' : id));
        return;
      }

      const hamburger = target.closest<HTMLElement>('[data-hamburger]');
      if (hamburger) { setDrawerOpen((v) => !v); return; }

      const bookBtn = target.closest<HTMLElement>('[data-book]');
      if (bookBtn) { onBookRef.current(); return; }

      const closeBooking = target.closest<HTMLElement>('[data-close-booking]');
      if (closeBooking || target.classList.contains('drawer-scrim')) { setOpenMentor(null); return; }

      const drawerLink = target.closest<HTMLElement>('[data-close-drawer]');
      if (drawerLink) { setDrawerOpen(false); return; }

      const clear = target.closest<HTMLElement>('[data-clear]');
      if (clear) { resetFilters(); return; }
    };
    document.addEventListener('click', onRootClick);
    const onInput = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.matches('[data-search]')) setQuery((t as HTMLInputElement).value);
      else if (t.matches('[data-sort]')) setSortBy((t as HTMLSelectElement).value as typeof sortBy);
    };
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    return () => {
      document.removeEventListener('click', onRootClick);
      document.removeEventListener('input', onInput);
      document.removeEventListener('change', onInput);
    };
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
          <span className="brand-name">Mentor&nbsp;Ledge</span>
        </a>

        <nav className="nav-links">
          <a href="#tiers">Tiers</a>
          <a href="#mentors">Mentors</a>
          <a href="#how">How it works</a>
          <a className="nav-cta" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <Github size={15} /> Star
          </a>
        </nav>

        <button className="hamburger" data-hamburger aria-label="Open menu">
          <Menu size={22} />
        </button>
      </header>

      {/* MOBILE DRAWER */}
      <div className={`drawer-scrim ${drawerOpen ? 'show' : ''}`} />
      <aside className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <a href="#tiers" data-close-drawer>Tiers</a>
        <a href="#mentors" data-close-drawer>Mentors</a>
        <a href="#how" data-close-drawer>How it works</a>
        <a className="drawer-cta" href={GITHUB_URL} target="_blank" rel="noreferrer" data-close-drawer>
          <Github size={15} /> Star on GitHub
        </a>
      </aside>

      {/* HERO */}
      <section className="hero" id="top">
        <div className="hero-glass">
          <div className="kicker">
            <span className="kicker-dot" /> mentorship at every stage of your journey
          </div>
          <h1 className="hero-title">
            Mentor <span className="grad">Ledge</span>
          </h1>
          <p className="hero-sub">
            Book the most in-demand builders & get advice over a videocall — without the
            <span className="hl"> $1,000s-for-15-minutes</span> gate. Mentorship for small creators, broken out by
            <span className="hl"> topic</span> (AI, growth, marketing, product) and by
            <span className="hl"> stage</span> (cheap early guides → premium operators).
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#mentors">Find a mentor</a>
            <a className="btn btn-ghost" href="#tiers">See the tiers</a>
          </div>
          <div className="hero-stats">
            <div><strong>{MENTORS.length}</strong><span>verified mentors</span></div>
            <div><strong>${Math.min(...MENTORS.map((m) => m.rate))}</strong><span>from / session</span></div>
            <div><strong>{TOPICS.length}</strong><span>focus topics</span></div>
          </div>
        </div>
      </section>

      {/* TIERS */}
      <section className="section" id="tiers">
        <div className="section-head">
          <h2>Pick your <span className="grad">stage</span></h2>
          <p>Three rungs on the ladder. Start cheap, move up as you grow.</p>
        </div>
        <div className="tier-ladder">
          {TIERS.map((t, i) => (
            <button
              key={t.id}
              data-tier={t.id}
              className={`tier-card ${tier === t.id ? 'active' : ''}`}
              style={{ ['--accent' as string]: t.accent }}
            >
              <div className="tier-rank">{i + 1}</div>
              <div className="tier-emoji">{t.emoji}</div>
              <div className="tier-label">{t.label}</div>
              <div className="tier-price">
                ${t.priceFrom}{t.priceTo ? `–$${t.priceTo}` : '+'} <span>/ session</span>
              </div>
              <p className="tier-blurb">{t.blurb}</p>
              <div className="tier-count">{tierCount(t.id)} mentors</div>
            </button>
          ))}
        </div>
      </section>

      {/* MENTORS */}
      <section className="section" id="mentors">
        <div className="section-head">
          <h2>Find your <span className="grad">mentor</span></h2>
          <p>Filter by topic, stage, or just search. Rates are honest and public.</p>
        </div>

        <div className="controls">
          <div className="search-wrap">
            <Search size={16} className="search-ico" />
            <input
              data-search
              className="search"
              placeholder="Search mentors, skills, topics…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="sort-wrap">
            <Filter size={15} />
            <select data-sort value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="tier">Sort: Tier ladder</option>
              <option value="priceAsc">Price: Low → High</option>
              <option value="priceDesc">Price: High → Low</option>
            </select>
          </div>
        </div>

        <div className="chips">
          {TOPICS.map((tp) => (
            <button
              key={tp.id}
              data-topic={tp.id}
              className={`chip ${topic === tp.id ? 'active' : ''}`}
            >
              {tp.emoji} {tp.label}
              <span className="chip-count">{topicCount(tp.id)}</span>
            </button>
          ))}
        </div>

        <div className="chips price-chips">
          {([
            { id: 'all', label: 'Any price', emoji: '💸' },
            { id: 'budget', label: 'Budget · under $30', emoji: '🌱' },
            { id: 'mid', label: 'Mid · $30–149', emoji: '🛠️' },
            { id: 'premium', label: 'Premium · $150+', emoji: '📡' },
          ] as const).map((p) => (
            <button
              key={p.id}
              data-price={p.id}
              className={`chip ${priceBand === p.id ? 'active' : ''}`}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        {(activeFilterCount > 0) && (
          <div className="filter-bar">
            <span>Showing {filtered.length} mentor{filtered.length !== 1 ? 's' : ''}</span>
            <button className="clear-btn" data-clear>Clear filters ✕</button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty">
            <Sparkles size={28} />
            <p>No mentors match yet. Try clearing a filter.</p>
            <button className="btn btn-ghost" onClick={resetFilters}>Reset</button>
          </div>
        ) : (
          <div className="mentor-grid">
            {filtered.map((m) => (
              <MentorCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="section-head">
          <h2>How it <span className="grad">works</span></h2>
          <p>Three steps. No gatekeepers, no vanity pricing.</p>
        </div>
        <div className="steps">
          <div className="step"><div className="step-num">1</div><h3>Pick a stage</h3><p>Rise for cheap early guidance, Build for traction help, Scale for hard-won playbooks.</p></div>
          <div className="step"><div className="step-num">2</div><h3>Filter by topic</h3><p>AI, growth, marketing, product, design, community — only pay for the help you need.</p></div>
          <div className="step"><div className="step-num">3</div><h3>Book a session</h3><p>Transparent rates, public profiles. Talk to someone one or ten steps ahead of you.</p></div>
        </div>
      </section>

      {/* SUPPLY CTA — become a mentor (mirrors intro.co's expert funnel) */}
      <section className="section become">
        <div className="become-glass">
          <div>
            <h2>Got experience? <span className="grad">Become a mentor</span></h2>
            <p>One step ahead of someone is enough. List your rate, pick your topics, and get booked — no agent, no gatekeeper. Start at $9, raise it as you grow.</p>
            <span className="become-note">Concept — mentor applications open soon.</span>
          </div>
          <a className="btn btn-primary" href="mailto:hello@mentorledge.app?subject=Mentor%20interest%20%2D%20Mentor%20Ledge">Apply to mentor →</a>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="brand"><span className="brand-mark">✶</span><span className="brand-name">Mentor Ledge</span></div>
            <p className="footer-tag">Mentorship at every stage. Inspired by @buildwithmaya.</p>
          </div>
          <div className="footer-links">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a>
            <a href="#mentors">Browse mentors</a>
            <a href="#tiers">Tiers</a>
            <a href="#how">Gift a session</a>
          </div>
        </div>
        <div className="footer-note">A concept marketplace — seed data from the CreatorPlaybooks mentor set. Modeled on intro.co, built for small creators.</div>
      </footer>

      {/* BOOKING DRAWER */}
      {openMentor && (
        (onBookRef.current = () => setBooked(openMentor.id)),
        <BookingDrawer
          m={openMentor}
          booked={booked}
        />
      )}
    </div>
  );
}

function MentorCard({ m }: { m: Mentor }) {
  const tierMeta = TIERS.find((t) => t.id === m.tier)!;
  return (
    <article
      data-mentor={m.id}
      className="card"
      style={{ ['--accent' as string]: tierMeta.accent }}
    >
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
        {m.topics.map((t) => {
          const tp = TOPICS.find((x) => x.id === t)!;
          return <span key={t} className="tag">{tp.emoji} {tp.label}</span>;
        })}
      </div>
      <div className="card-foot">
        <div className="rate">
          <span className="rate-price">${m.rate}</span>
          <span className="rate-note">{m.rateNote}</span>
        </div>
        <div className="card-cta">Book →</div>
      </div>
    </article>
  );
}

const BookingDrawer = forwardRef<HTMLDivElement, {
  m: Mentor;
  booked: string | null;
}>(function BookingDrawer({ m, booked }, ref) {
  const tierMeta = TIERS.find((t) => t.id === m.tier)!;
  const isBooked = booked === m.id;
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
            <div className="booking-tier">{tierMeta.emoji} {tierMeta.label} tier</div>
          </div>
        </div>

        <p className="booking-bio">{m.bio}</p>

        <div className="booking-stats">
          <div><Star size={13} /> {fmtFollowers(m.followers)} followers</div>
          <div>{priceLabel(m.rate, m.rateNote)}</div>
        </div>

        <h4>What you'll get help with</h4>
        <ul className="strengths">
          {m.strengths.map((s) => (
            <li key={s}><Check size={14} /> {s}</li>
          ))}
        </ul>

        <div className="booking-topics">
          {m.topics.map((t) => {
            const tp = TOPICS.find((x) => x.id === t)!;
            return <span key={t} className="tag">{tp.emoji} {tp.label}</span>;
          })}
        </div>

        {isBooked ? (
          <div className="booked">
            <Calendar size={16} /> Demo request sent to {m.name}.
            <div className="booked-note">Concept demo only — no real booking is made. Stripe + Cal.com wiring comes next.</div>
          </div>
        ) : (
          <button className="btn btn-primary book-btn" data-book>
            <Calendar size={16} /> Book a session · ${m.rate}
            <span className="book-btn-demo">demo</span>
          </button>
        )}
      </aside>
    </div>
  );
});
