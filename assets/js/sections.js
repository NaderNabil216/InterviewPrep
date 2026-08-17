// sections.js — single source of truth for the seven section labels and the predicate
// that decides which items carry them. Modelled on levels.js: no view hardcodes a label
// string or a type test of its own (FR-001, FR-005, FR-006).
export const SECTION_LABEL = {
  question: 'Question',
  shortAnswer: 'The 30-second answer',
  answer: 'The full picture',
  code: 'Code',
  followUps: "They'll ask next",
  traps: 'What sinks you',
  refs: 'Sources',
};

export function isLabelled(item) {
  return item?.type === 'qa';
}