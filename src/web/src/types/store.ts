/* ─── Character Store Types ──────────────────────── */

import type { CharacterAppearance } from './appearance';

export interface SkillRef {
  id: string;
  name: string;
  category: 'core' | 'engineering' | 'operations' | 'domain';
}

export interface CreatorRef {
  id: string;
  name: string;
  avatar?: string;
}

export interface StoreCharacter {
  id: string;
  name: string;
  tagline: string;

  // Appearance (TyconoForge)
  appearance: CharacterAppearance;

  // Personality
  persona: string;
  chatStyle: string;

  // Skills
  skills: SkillRef[];
  level: 'c-level' | 'team-lead' | 'member';
  authority: {
    autonomous: string[];
    needsApproval: string[];
  };

  // Resume
  resume: {
    summary: string;
    strengths: string[];
    specialties: string[];
    experience: string;
  };

  // Meta
  author: CreatorRef;
  tags: string[];
  price: 'free' | number;
  installs: number;
  rating: number;
  featured: boolean;

  // #random integration
  randomActive: boolean;
  randomPersonality: string;
}
