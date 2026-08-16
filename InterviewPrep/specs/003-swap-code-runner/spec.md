# Feature Specification: Swap the DSA Code Runner to a No-Card Provider

**Feature Directory**: `specs/003-swap-code-runner`

**Feature Branch**: `feat/003-code-runner-ce-judge0` (off `main`)

**Created**: 2026-08-16

**Status**: Ready for implementation — Q1 and Q2 resolved 2026-08-16 (decisions recorded in
[Open Questions](#open-questions), provider live-verified against `ce.judge0.com` the same day).

**Input**: User description: "i want to replace the Judge0 CE in DSA online compiler with onlinecompiler.io ,
since onlinecompiler.io doen't require a credit card info for creating the free account." — followed by a
research pass (this spec) that found a better answer than the named provider, and a user decision
(2026-08-16) to implement it.

## Why This Feature Exists

The DSA "Run" button (shipped by feature `002-improvements`, US6) is the app's only external-service
dependency. It was deliberately **bring-your-own-key**: the app ships no credential, and a candidate who
wants to run code pasted their own free key into Settings.

The problem is the word *free*. Obtaining the current provider's key requires signing up on a
marketplace that asks for **credit-card details up front**, even for the zero-cost plan. For a candidate
who wants to try one Kotlin function against one sample input the week before an interview, "give us a
card number first" is where the feature ends. The result is that Run is, in practice, off for most
candidates — the app renders a button they will never press.

The card requirement was never intrinsic to Judge0 — it came from the **RapidAPI gateway** that fronts
it. Judge0 itself runs a **public instance at `ce.judge0.com`** that requires **no account, no payment
details, and no API key at all**: a candidate who has never heard of any of this presses Run and it
works, with nothing configured. Live-verified 2026-08-16 from a browser-compatible origin: CORS headers
are returned for arbitrary origins, Kotlin 2.1.10 (language id 111) compiles and runs, and the
compile-error and runtime-error response shapes are identical to what the app already maps. The entire
credential machinery — settings field, key check, RapidAPI headers — becomes dead weight and is
removed.

## ⚠ Scope-Defining Constraints

1. **The candidate never holds a credential.** There is no sign-up, no key, nothing to store. Every
   requirement below that names a "credential" from feature `002-improvements` is vacated, not
   migrated: the settings field is deleted, the stored key is discarded, and no header is sent.
2. **The provider is a synchronous-submit instance with `wait=true` disabled.** `GET
   /config_info` on `ce.judge0.com` reports `enable_wait_result: false` (checked 2026-08-16). A run is
   therefore **submit-then-poll**: `POST /submissions` returns a token, and `GET
   /submissions/{token}` is polled until the `status.id` is terminal. The app's existing fixed
   30-second client bound and in-flight supersede rule carry over unchanged.
3. **The public instance rate-limits anonymous use.** The exact ceiling is not documented anywhere
   the maintainers publish; community reports put it near **~50 submissions/day per IP** (the instance
   exposes `x-judge0-submission-count` headers). One candidate studying runs a handful of times per
   session, so this is not a design constraint — but a rate-limit rejection MUST render as a readable
   "busy, try again later" state, never as a credential or connectivity failure.
4. **Kotlin stays.** The provider runs Kotlin (2.1.10), so no DSA item is re-authored, no starter or
   `sampleCall` driver changes, and the scratchpad keeps its language. This is the deciding fact that
   made `ce.judge0.com` beat the originally-named alternative, which does not run Kotlin (see Q1).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run code without handing over a card — or anything else (Priority: P1)

A candidate opens a DSA problem, writes a solution in the scratchpad, and presses Run. They have never
configured a code runner, never signed up for anything, and hold no key. The run executes against the
item's sample input and the panel shows their program's real output — no setup step exists anywhere.

**Why this priority**: This is the feature. Every other story here exists only because this one
changes providers. If only this ships, the barrier that made Run unusable is gone — and so is the
setup step that replaced it.

**Independent Test**: Fully testable end to end by a person who has never held an account with any
code-execution service: press Run on a DSA problem with a correct solution and confirm real output
appears, with no screen in between asking for anything.

**Acceptance Scenarios**:

1. **Given** a candidate with no runner configured — no key, no account, nothing — **When** they press
   Run on a runnable DSA problem, **Then** a request is sent immediately and the panel shows the
   program's real output for the item's sample input.
2. **Given** the same candidate, **When** they open Settings, **Then** there is no credential field of
   any kind; the code-runner guidance states that Run needs no account, no key, and no payment
   details.
3. **Given** a valid connection and a solution that does not compile, **When** the candidate presses
   Run, **Then** the panel shows the compiler's own error text, clearly distinguished from ordinary
   output.
4. **Given** a valid connection and a solution that compiles but fails at run time, **When** the
   candidate presses Run, **Then** the panel shows the runtime failure text, clearly distinguished
   from both ordinary output and a compile failure.
5. **Given** a solution that never terminates, **When** the provider stops it, **Then** the panel says
   the program was stopped for running too long — not that the request failed.

---

### User Story 2 - Nobody is stranded by the switchover (Priority: P1)

A candidate who already configured the **old** provider's key opens the app after the change. Their old
credential is worthless and must not linger in storage pretending to be valid, and it must never be
sent anywhere. Their study history is untouched: drill schedule, notes, plan ticks, mock results, and
every scratchpad's saved code all survive the switchover unchanged.

**Why this priority**: A credential swap that silently produces "couldn't reach the runner" turns a
five-second fix into an unfixable bug from the candidate's side. Equal priority to US1 because shipping
US1 alone actively breaks existing users of the feature.

**Independent Test**: Configure the old provider's key on a device, apply the change, and confirm both
that the stale credential no longer sits in storage and that pressing Run produces real output with no
setup — and separately confirm that a full progress export before and after the change is identical.

**Acceptance Scenarios**:

1. **Given** a device holding a credential for the old provider, **When** the app next starts, **Then**
   the stale credential is discarded — absent from storage, absent from any export, never sent to any
   host.
2. **Given** that same device, **When** the candidate presses Run, **Then** the run just works exactly
   as for a candidate who never configured anything.
3. **Given** that same device, **When** the candidate opens Settings, **Then** there is no credential
   field and no stale reference to the old provider anywhere in the app.
4. **Given** any device with existing study history, **When** the change is applied, **Then** drill
   schedule, notes, plan ticks, mock results, and saved scratchpad code are byte-identical before and
   after.

---

### User Story 3 - Failure modes stay honest and distinguishable (Priority: P2)

The new endpoint fails in ways the old one did not, and some old failure modes simply cease to exist. A
candidate must always be able to tell *which* thing went wrong, because the correct next action differs
every time:

- The instance rate-limits anonymous traffic. That is a "try again in a moment" condition, not a
  broken connection and not a credential problem.
- The sandbox stops a program that runs too long (5 s CPU / 10 s wall per `/config_info`). That is the
  candidate's infinite loop, not a network problem.
- There is **no** output truncation and **no** concurrency refusal on this provider, so those two
  failure modes from the original provider evaluation are explicitly out of scope here.

**Why this priority**: Wrong diagnosis wastes study time. Lower than P1 only because the feature is
still usable if these states are merely generic — it is just worse.

**Independent Test**: Drive each condition deliberately — an infinite loop, and a burst of runs
against the public rate limit — and confirm each produces its own distinct, actionable message.

**Acceptance Scenarios**:

1. **Given** a program that never terminates, **When** the provider stops it, **Then** the panel says
   the program was stopped for running too long — not that the request failed.
2. **Given** the provider rejects a run because of anonymous rate limiting, **When** the response
   arrives, **Then** the panel says the runner is busy and to retry shortly — not that the connection
   is at fault and not that any credential is missing.
3. **Given** any of the above, **When** the candidate presses Run again, **Then** the previous result
   is cleared before the new one is shown, so a stale message can never be read as the current one.

---

### User Story 4 - Everything else still works with no runner at all (Priority: P2)

A candidate who is fully offline uses the whole rest of the app exactly as before: topics, drills, mock
interviews, cheat sheets, system design, plans, search, and the DSA problems themselves including
reading solutions and typing in the scratchpad. Only the act of pressing Run needs the network.

**Why this priority**: The app's core promise is that it works offline from a local snapshot. The runner
is the single exception, and swapping providers must not widen that exception by even one request.

**Independent Test**: Load the app with the network disabled; exercise every view and confirm nothing
degrades, errors, or hangs, and that no outbound request is attempted anywhere except from a deliberate
Run press.

**Acceptance Scenarios**:

1. **Given** no network, **When** the candidate uses any view other than the DSA Run action, **Then**
   behaviour is identical to before this change and no outbound request is attempted.
2. **Given** no network, **When** the candidate opens a DSA problem, **Then** the prompt, hints,
   solution, and scratchpad are fully usable and the scratchpad still saves what they type.

---

### Edge Cases

- **A stale RapidAPI key already in storage.** Discarded on first read after this change (US2
  scenario 1) — never migrated, never sent, never exported.
- **Kotlin already sitting in a candidate's scratchpad.** Unchanged — the executed language is still
  Kotlin, so saved scratchpads keep compiling exactly as before. No re-authoring anywhere.
- **The runner takes longer than the client is willing to wait.** The client keeps its fixed 30-second
  bound; the sandbox also stops long-running programs on its own (5 s CPU). Both surface as finite,
  readable states — never an indefinite spinner.
- **A browser refuses the request outright** (for reasons unrelated to the candidate's connection).
  From the candidate's seat this is indistinguishable from being offline. It never presents as a hang.
- **Second Run pressed while one is in flight.** The earlier run is superseded and can never paint over
  the newer one's result — the existing guarantee, preserved. The superseded poll loop is aborted, not
  left polling in the background.
- **Rate-limited mid-study-session.** Reads as "busy, try again later" (US3 scenario 2). A fresh Run
  press later is a normal new attempt.
- **An item with no runnable sample.** Run stays disabled with a short explanation and sends nothing —
  the existing guarantee, preserved.
- **The public instance is down or moved.** Reads as a connectivity problem with the standard retry
  guidance — the same state as any other network failure. This is a donation-funded public instance;
  no SLA is claimed anywhere in this spec.

## Requirements *(mandatory)*

### Functional Requirements

**Provider swap**

- **FR-001**: The DSA Run action MUST execute the candidate's code through the Judge0 CE public
  instance at **`ce.judge0.com`** and MUST NOT contact RapidAPI, `judge0-ce.p.rapidapi.com`, or any
  other execution service.
- **FR-002**: No reference to RapidAPI, its sign-up path, an API key, or the old credential flow may
  remain anywhere a candidate can see — Settings copy, the DSA scratchpad caption, result-panel
  messages, or any help text.
- **FR-003**: The Run action MUST remain the **only** outbound network dependency introduced anywhere
  in the app outside its own content files. This feature adds no other external call, on any view or
  boot path.
- **FR-004**: The Settings guidance MUST state plainly that Run needs **no account, no key, and no
  payment details**, and MUST link to the provider's docs entry point (`ce.judge0.com`) so a candidate
  can confirm the state of the service without leaving the app to guess.

**Zero credential surface**

- **FR-005**: The app MUST NOT collect, store, or transmit any execution-service credential. There is
  no settings field, no stored value, and no header. (Vacates 002's FR-005/FR-006.)
- **FR-006**: A stored credential belonging to the **old** provider MUST be discarded on first read
  after this change — removed from storage, excluded from exports, and never sent to any host.
- **FR-007**: Pressing Run MUST send the request with nothing configured. The former "needs a key"
  state is deleted outright; its nearest surviving analogue is the plain connectivity failure.
- **FR-008**: A rate-limit rejection by the provider MUST surface as a transient "runner is busy, try
  again in a moment" condition — never as a connectivity failure and never as a credential problem.

**What gets executed**

- **FR-009**: The submitted program MUST be the candidate's current scratchpad contents — whatever they
  have typed, including partial or broken work — combined with a generated entry point that invokes the
  item's authored sample input and prints the result. No hidden pre-supplied solution is ever
  submitted.
- **FR-010**: The executed language MUST remain **Kotlin** (provider language id 111, Kotlin 2.1.10).
  No DSA starter, `sampleCall` driver, or solution is re-authored by this feature; no content file
  changes at all.
- **FR-011**: An item without a usable sample-input driver MUST render Run disabled with a short
  explanation and MUST NOT send a request — the existing behaviour, preserved through the swap.
- **FR-012**: The app MUST NOT derive or display a pass/fail verdict. Run executes and displays; the
  candidate compares the output against the item's prompt themselves — the existing decision,
  unchanged.

**Run lifecycle**

- **FR-013**: A run MUST follow the provider's synchronous-submit contract: `POST /submissions` (no
  `wait`), then `GET /submissions/{token}` polled until the submission's `status.id` is terminal.
- **FR-014**: A completed run MUST be presented as exactly one of: ordinary output, a compile failure,
  a runtime failure, the program stopped for running too long, the runner busy (rate-limited), a
  connectivity problem, in-flight, or not-runnable. Each MUST be visually and textually distinguishable
  from the others.
- **FR-015**: A program the sandbox stops for exceeding its time limit MUST read as "stopped for
  running too long" (status ids 5 / 15), never as a generic request failure.
- **FR-016**: While a run is in flight the panel MUST show an explicit pending state that **replaces**
  any previous result, and the Run control MUST show that it is working.
- **FR-017**: Every Run MUST reach a terminal state within a fixed, finite bound (30 seconds, the
  existing client bound). No path may leave an indefinite spinner, and no path may fail silently with
  the panel unchanged.
- **FR-018**: Pressing Run while a previous run for the same problem is still in flight MUST supersede
  the earlier run cleanly — the earlier poll loop is aborted and its result MUST never be rendered.

**Preservation**

- **FR-019**: This change MUST NOT read, write, migrate, or delete any learning state — drill schedule,
  notes, plan ticks, mock results — nor alter any saved scratchpad code.
- **FR-020**: No view, route, or boot path other than the DSA problem detail page and Settings may
  change behaviour as a result of this feature.
- **FR-021**: A run result MUST remain throwaway, view-local state — not persisted, not exported, not
  restored on return to the problem.

### Key Entities

- **Run Request** — one execution: the candidate's scratchpad text plus the generated Kotlin entry
  point, submitted to `ce.judge0.com/submissions` and polled by token until terminal. Carries no
  credential. (Replaces 002's **Code Runner Credential** entity, which no longer exists.)
- **Runnable Sample** — the per-item authored starter plus the sample-input driver expression that the
  generated entry point invokes. Kotlin, unchanged by this feature.
- **Run Result** — the transient outcome of one Run press: which of FR-014's states it landed in, plus
  the text to show. Never persisted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A candidate who has never held an account with any code-execution service can press Run
  on a DSA problem and see real output from their own code — **zero setup steps, zero screens asking
  for anything**.
- **SC-002**: **Zero** screens anywhere in the app (or linked from it as the Run setup path) request a
  credit card, billing address, payment instrument, or sign-up of any kind — the sign-up path no longer
  exists to ask.
- **SC-003**: **100%** of DSA items presented to the candidate as runnable actually execute and return
  output, a compile error, or a runtime error — no item offers Run and then fails for reasons intrinsic
  to the item rather than to the candidate's code or connection.
- **SC-004**: **100%** of a candidate's pre-existing study history — drill schedule, notes, plan ticks,
  mock results, saved scratchpad code — is identical before and after the switchover, verified by
  comparing a progress export taken on each side.
- **SC-005**: Every distinct failure condition in FR-014 produces a message a candidate can act on
  without outside help, verified by walking each one deliberately; **none** resolves to a generic
  "something went wrong".
- **SC-006**: **Every** Run press reaches a visible terminal state within the app's fixed 30-second
  wait bound — **zero** indefinite spinners and **zero** silent no-ops across the walked failure set.
- **SC-007**: A candidate who never configures a runner and is fully offline can use **every** other
  part of the app with no degradation and **zero** attempted outbound requests.
- **SC-008**: A candidate carrying the old provider's credential needs to do **nothing**: the stale
  key is discarded silently, and their first Run press after the change works exactly like anyone
  else's, with no data loss and no setup.

## Assumptions

These are the defaults chosen where the request did not specify. Any of them can be overridden, but they
are what the requirements above are written against.

- **The motivation is the payment barrier, not cost.** Both the old and new paths are zero-cost; what
  changes is that the new one requires no card and, in fact, nothing at all — no account, no key.
- **"Replace" means replace.** RapidAPI/Judge0-via-RapidAPI is removed outright rather than kept as a
  second selectable option. A two-provider settings surface is not in scope.
- **The stale credential is discarded, not migrated.** There is no mapping from an old key to a new
  one, and no new key to map to. Discarding it is also the privacy-preferable outcome: a dead
  credential should not linger in storage.
- **Content and learning state stay physically separate — and this feature touches neither.** No
  content file changes (Kotlin stays), and item identifiers are neither reused nor renumbered.
- **The public instance's rate limit is treated as a real but non-blocking constraint.** Community
  reports put it near ~50 submissions/day/IP; a single candidate's study usage is a fraction of that.
  The app must render a rate-limit rejection readably (FR-008), not engineer around it.
- **The existing 30-second client wait bound is kept**, comfortably above the sandbox's own 5 s CPU /
  10 s wall ceilings. No retry is automatic; a failed run is a fresh candidate-initiated action.
- **The provider's CORS posture was verified live on 2026-08-16** from a browser-compatible origin
  against the exact endpoints the app will use (`POST /submissions`, `GET /submissions/{token}`):
  `Access-Control-Allow-Origin` is returned for arbitrary origins, `allow-headers: *`,
  `allow-methods: *`. The first implementation task is nonetheless a five-minute browser smoke test of
  one real run from `tools/serve.sh`'s `localhost` origin, exactly as feature `002-improvements`
  required for the provider it chose.
- **No pass/fail grading is introduced.** No item carries expected output, and none is added.

## Open Questions

Both questions that blocked the previous draft were resolved on **2026-08-16** by the research pass
that produced this spec; both resolutions were confirmed live against the provider the same day.

### Q1 — Which provider, and what happens to the 60 Kotlin items? *(resolved: keep Kotlin, zero re-authoring)*

The originally-named provider (onlinecompiler.io) publishes 12 languages and does not run Kotlin, which
would force re-authoring every DSA starter and driver. The research pass rejected it on that ground
alone (Q1's option A in the previous draft — "port everything to Java" — was the only way to use it,
and it would make the scratchpad's language stop matching the Kotlin solutions shown beside it on an
Android prep site).

**Decision — Judge0 CE's public instance (`ce.judge0.com`), Kotlin unchanged.** The provider executes
Kotlin 2.1.10 (language id 111, confirmed via `GET /languages/`), requires no account and no key, and
answers browser `fetch` calls (CORS verified live). All 60 runnable items keep their Kotlin starters
and `sampleCall` drivers; no content file changes. The only integration changes are the endpoint URL,
the removal of the credential headers and key checks, and the switch to submit-then-poll. Evidence:
live probes on 2026-08-16 — `OPTIONS`/`POST`/`GET` against `ce.judge0.com` from `localhost:8777`
origin; a Kotlin hello-world POST returned `status {id: 3, Accepted}` with `stdout`; a deliberately
broken POST returned `status {id: 6, Compilation Error}` with `compile_output`; `GET /config_info`
reports `enable_wait_result: false` (hence poll) and `cpu_time_limit: 5.0` (hence the "stopped for
running too long" state).

### Q2 — Ship a key, or keep bring-your-own-key? *(resolved: neither — there is no key)*

The provider the previous draft considered offered an embeddable key type, forcing the choice between
shipping a world-readable shared secret and keeping a candidate setup step.

**Decision — no credential of any kind.** `ce.judge0.com` authenticates nobody: requests carry no key,
so the app collects, stores, and transmits nothing (FR-005). This is strictly better than both options
the previous draft offered: zero setup for every candidate, and no secret exists to leak. The settings
field, the storage default, and the `X-RapidAPI-*` headers all disappear; any previously stored
RapidAPI key is discarded on first read (FR-006).