// levels.js — single source of truth for difficulty labels.
// Item `level` is 1-4; every view renders it through here so the wording can never drift.
export const LEVEL_LABEL = {
  1: 'Basics',
  2: 'Mid-Level',
  3: 'Senior',
  4: 'Lead',
};

export function levelLabel(level) {
  return LEVEL_LABEL[level] || `Level ${level}`;
}
