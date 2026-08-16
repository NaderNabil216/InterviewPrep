# Specification Quality Checklist: Swap the DSA Code Runner to a No-Card Provider

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-16
**Feature**: [../spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *see Note 1; two named exceptions, both scope-bearing*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain — **Q1 and Q2 resolved 2026-08-16, recorded in the spec's Open Questions**
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria — **FR-011 is contingent on Q1**
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

**Note 1 — two deliberate named exceptions to "no implementation details".** The spec names both
providers (Judge0 CE / RapidAPI and the candidate provider ce.judge0.com) and names Kotlin and Java.
These are not leaked implementation choices — they *are* the request. The user's stated requirement is a
provider swap for a specific business reason (the incumbent demands payment details for its free tier),
so the provider identity is scope. Held to the spirit of the rule, the spec deliberately excludes:
endpoint URLs, HTTP methods, header names, request/response field names, language identifier strings,
and concrete numeric service limits. Those are recorded here for the planning phase instead:

- Synchronous-execution flow and request/response field names — confirmed live against the provider's
  own docs and instance (`GET /config_info`, `GET /languages/`) and by direct probes from the app's local
  origin, 2026-08-16. `enable_wait_result=false` → the app polls a submission token to a terminal state.
- The provider runs Kotlin 2.1.10 (the library's only authored language), so **no item is re-authored**;
  the "Kotlin absent / Java only" constraint that sized the earlier draft belongs to the provider that
  draft named and does not apply here.
- The provider is anonymous and keyless; the earlier draft's Q2 (ship a key vs bring-your-own-key) is
  vacated — there is no key to choose between.
- The public instance rate-limits anonymous traffic (ceiling undocumented; community-reported near
  ~50 submissions/day/IP) — surfaced as a readable "busy, try again" state, treated as a real but
  non-blocking constraint.

**Note 2 — content-side facts measured, not assumed.** The 60 runnable items / 60 Kotlin starters /
60 Kotlin drivers / 67 Kotlin code blocks figures were counted directly from `content/packs/*.json` in the
app repo on 2026-08-16, not estimated. None of them change under this feature — the executed language
stays Kotlin.

**Note 3 — previously unchecked items were user-gated; both gates closed on 2026-08-16.** The
originally-named provider could not run the library's language, so the spec's size depended on a user
decision (Q1). The research pass that produced the current spec found a keyless, Kotlin-capable,
browser-callable alternative, the user approved it, and Q1/Q2 were both resolved before planning —
their resolutions are recorded in the spec's Open Questions with the live evidence.

**Validation iterations**: 1. All non-user-gated items pass.
