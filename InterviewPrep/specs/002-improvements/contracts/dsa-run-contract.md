# Contract: DSA "Run" ↔ Judge0 CE

**Feature**: `002-improvements` · **Spec**: [../spec.md](../spec.md) · **Research**: [../research.md](../research.md) (R-007)

This is the app's **first and only** external-service contract — every other interface in this repo is
either a static-file fetch of the app's own content (`content.js`) or a CLI tool over the local
filesystem. Nothing else in `assets/js/**` may add a network call outside this one (FR-022).

## Preconditions

- Candidate has entered their own RapidAPI Judge0 CE key in Settings (`Store.getSettings().judge0ApiKey`).
  If absent, the Run button is still visible (so the feature is discoverable) but pressing it shows the
  `needs-key` state (see [data-model.md](../data-model.md)'s DSA Run Result) instead of making a request —
  no request is ever sent with an empty/missing key.
- Candidate is online. If `navigator.onLine` is `false`, or the request fails/times out, the `needs-
  connection` state is shown instead — same rule: fail closed, never a silent no-op or an indefinite
  spinner (FR-020).
- The item carries a non-empty `sampleCall`. If it does not (its authoring batch hasn't landed yet —
  `sampleCall` rolls out per pack, R-006), the Run button renders **disabled** with a short "not
  runnable yet" explanation and no request is ever sent (FR-019c). This is a normal intermediate
  state during rollout, not an error.

### Key handling (FR-018a)

The candidate's key is read from `Store.getSettings().judge0ApiKey` at request time and used for
exactly one thing: the `X-RapidAPI-Key` header on that candidate's own Run request. It MUST NOT be
written to `console` (at any level, including during debugging), included in any error message or
Run Result `text` rendered on the page, embedded in a URL or query string, or sent to any host other
than the execution service itself. When a request fails, the surfaced message is the fixed
`needs-connection`/`needs-key` copy — never a dump of the failing request that would echo the header
back onto the screen.

## Request

```
POST https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true
Headers:
  Content-Type: application/json
  X-RapidAPI-Key: <candidate's own key, from Settings — never an app-embedded key>
  X-RapidAPI-Host: judge0-ce.p.rapidapi.com
Body:
  {
    "language_id": 111,               // Kotlin (2.1.10) — https://ce.judge0.com/languages/, checked 2026-08-14
    "source_code": "<candidate's editor contents>\n\nfun main() {\n    println(${item.sampleCall})\n}"
  }
```

- `wait=true` requests Judge0's synchronous mode — the response *is* the result, no submit-then-poll
  two-step needed for this app's single-shot Run button.
- `source_code` is always the candidate's current editor contents (whatever they've typed, including a
  partial/broken solution) with the generated driver appended — never the item's `starter` field directly
  once the candidate has edited it, and never a hidden pre-supplied solution.
- One in-flight request per DSA item view instance. Pressing "Run" again while a request is pending aborts
  the prior one via `AbortController` before sending the new one (Edge Cases: superseded cleanly, not
  raced).
- Client-side request timeout: **30 seconds** (FR-020c), after which the request is aborted and the
  `needs-connection` state is shown. Deliberately generous — compiling and running a JVM-family language
  is not instant — but fixed and finite: a request that never resolves must still surface as a failure,
  not an indefinite spinner.

## Response → DSA Run Result mapping

| Judge0 response shape | DSA Run Result `kind` | `text` | `statusLabel` |
|---|---|---|---|
| `status.id` = Accepted (3), `stdout` present | `'output'` | `stdout` | `status.description` |
| `compile_output` present (non-null) | `'compile-error'` | `compile_output` | `status.description` |
| `status.id` indicates a runtime failure (e.g. Runtime Error variants, Time Limit Exceeded) and `stderr`/`message` present | `'runtime-error'` | `stderr` (fallback `message`) | `status.description` |
| Network failure, timeout, non-2xx, or aborted | `'needs-connection'` | fixed message, e.g. "Run needs a connection." | — |
| No `judge0ApiKey` in Settings | `'needs-key'` | fixed message pointing at Settings | — |
| Item has no `sampleCall` yet (rollout in progress) | `'not-runnable'` | fixed message, e.g. "This problem isn't runnable yet." — Run is disabled, no request sent (FR-019c) | — |
| Request sent, not yet resolved | `'pending'` | fixed message, e.g. "Running…" — replaces any previous result in the panel, and the Run action reflects that it is working (FR-020b) | — |

`'pending'` is a real state of the panel, not merely a spinner on the button: the previous run's output
is cleared when a new run starts, so a stale result can never be mistaken for the current one.

There is **no** pass/fail verdict derived from this response — no item in this content set carries
`expected_output` or hidden test data, and none is added by this feature. The candidate reads `text`
against the item's `prompt` themselves, exactly as the spec's clarification decided.

## What this contract explicitly does not do

- Does not grade correctness.
- Does not retry automatically — a failed Run is a fresh, candidate-initiated action, not a background
  process.
- Does not touch any other view, route, or boot path — Topics/Drill/Mock/cheat sheets/system design are
  unaffected whether or not a candidate has ever configured a Judge0 key (FR-022).
- Does not persist the result (see [data-model.md](../data-model.md) — DSA Run Result is view-local,
  throwaway state; only the candidate's *code* persists, via the existing Scratch mechanism, unchanged).
