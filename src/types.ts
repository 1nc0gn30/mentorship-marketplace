export type TierId = 'rise' | 'build' | 'scale';

export interface Tier {
  id: TierId;
  label: string;
  emoji: string;
  blurb: string;
  priceFrom: number;
  priceTo: number | null;
  accent: string;
}

export type TopicId =
  | 'ai'
  | 'growth'
  | 'marketing'
  | 'product'
  | 'no-code'
  | 'design'
  | 'community'
  | 'fundraising';

export interface Topic {
  id: TopicId;
  label: string;
  emoji: string;
}

export interface Mentor {
  id: string;
  name: string;
  handle: string;
  xHandle: string;
  avatar: string;
  bio: string;
  followers: number;
  tier: TierId;
  topics: TopicId[];
  rate: number;
  rateNote: string;
  strengths: string[];
}
