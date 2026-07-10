// --- The three narrow wedges we launch with. ---
export type CategoryId =
  | 'launch'
  | 'positioning'
  | 'content';

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  blurb: string;
  accent: string;
}

// --- Outcome-based session products (each session is a product, not a call). ---
export type SessionId =
  | 'landing-teardown'
  | 'idea-validation'
  | 'launch-plan'
  | 'x-strategy'
  | 'offer-review'
  | 'first-users'
  | 'growth-audit'
  | 'newsletter';

export interface SessionType {
  id: SessionId;
  label: string;
  emoji: string;
  blurb: string;
  category: CategoryId;
}

// --- Vetted expert. The supply side. ---
export type TierId = 'micro' | 'proven' | 'status';

export interface Tier {
  id: TierId;
  label: string;
  emoji: string;
  priceFrom: number;
  priceTo: number | null;
  accent: string;
}

export interface Expert {
  id: string;
  name: string;
  handle: string;
  xHandle: string;
  avatar: string;
  bio: string;
  followers: number;
  tier: TierId;
  categories: CategoryId[];
  sessions: SessionId[];
  rate: number;
  rateNote: string;
  // Vetting signals — proof of work, not "guru" energy.
  proof: string[];
  outcomes: string[];
  // Pre-call intake options this expert can match on.
  canHelpWith: string[];
}
