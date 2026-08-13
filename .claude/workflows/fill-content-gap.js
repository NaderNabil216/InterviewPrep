export const meta = {
  name: 'fill-content-gap',
  description: 'Fill the InterviewPrep content gap — one outline+author+review agent group per track',
  whenToUse: 'When content/packs needs expanding toward the planned per-track item counts. Pass args: {release, checked, tracks:[{track,prefix,packTitle,packBase,gap,startId,chunk,existing[],scope}]}',
  phases: [
    { title: 'Outline', detail: 'one agent per track plans the exact missing items, deduped against what exists' },
    { title: 'Author', detail: 'chunked agents write full item JSON straight into new pack files' },
    { title: 'Review', detail: 'one adversarial reviewer per track verifies technical claims and fixes in place' },
  ],
}

const ROOT = '/Users/nn/InterviewPrep'

// ---------------------------------------------------------------- wave configs
// Gap table this workflow exists to close (plan target - built as of 2026.08.6):
//   kotlin 57 · compose 64 · security-kmp 67 · platform 50 · build-testing 58 · dsa 41
//   coroutines-flow 47 · architecture 43 · data-networking 36 · performance 37
//   behavioral 22 · system-design 14   = 536 items
// startId values are (highest existing id in that prefix) + 1. Do not reuse an id, ever.

const WAVES = {
  wave1: {
    release: '2026.08.7',
    tracks: [
      {
        track: 'kotlin', prefix: 'kt', packTitle: 'Kotlin Language', packBase: 'kotlin-g',
        gap: 57, startId: 14, chunk: 5, itemType: 'qa',
        existing: ['content/packs/kotlin-a.json', 'content/packs/kotlin-b.json'],
        outlineFile: '.claude/workflows/outlines/kotlin.json',
        reuseOutline: true,
        scope: 'Planned ~70 items total for this track. Must cover, at senior depth: null-safety internals and platform types; data/value/sealed/object/companion modeling; generics, variance, star projections, type erasure, reified workarounds; inline / noinline / crossinline and when inlining hurts; higher-order functions, function references, closures and captured-variable cost; lambdas vs SAM conversion vs fun interfaces; collections vs sequences (including when sequences are SLOWER); collection-operator internals (map/flatMap/fold/groupBy/associate/partition/chunked/windowed); mutability and read-only views; equality/hashCode and data-class pitfalls inside sets and maps; destructuring; choosing the right scope function; delegation (by, lazy modes, observable/vetoable, map-backed, custom ReadWriteProperty); property initialization order, lateinit vs lazy vs nullable; init blocks and constructor ordering; visibility incl. internal across modules; operator overloading; infix and tailrec; contracts and smart-cast enablement; exceptions, the absence of checked exceptions, Result vs sealed error types, runCatching vs cancellation; Nothing; typealiases incl. nested typealiases; annotations, use-site targets, JVM interop (@JvmStatic/@JvmOverloads/@JvmName/@JvmField/@Throws); Java interop: platform types, nullability annotations, SAM, default args from Java; DSL building with receivers and @DslMarker; enum vs sealed dispatch and exhaustiveness; reflection cost and how to avoid it; kotlin.time Duration; unsigned types; string handling and buildString; the K2 compiler — what changed and what broke; context parameters (successor to context receivers); explicit backing fields; the unused-return-value checker; guard conditions in when; what is genuinely new across Kotlin 2.0 to 2.4 and which parts are stable; the multiplatform-safe language subset; equals/compareTo contracts; comparison and sorting; stdlib gotchas that show up in interviews.',
      },
      {
        track: 'coroutines-flow', prefix: 'co', packTitle: 'Coroutines & Flow', packBase: 'coroutines-g',
        gap: 47, startId: 9, chunk: 10, itemType: 'qa',
        existing: ['content/packs/coroutines-a.json'],
        outlineFile: '.claude/workflows/outlines/coroutines-flow.json',
        reuseOutline: true,
        scope: 'Planned ~55 items total. Must cover: suspend-function compilation to CPS and the state machine, Continuation, label dispatch and spilled locals; what a suspension point actually costs; CoroutineContext composition and its core elements; Job vs SupervisorJob, parent-child hierarchy, structured-concurrency guarantees; cancellation is cooperative — ensureActive, yield, isActive, suspendCancellableCoroutine; CancellationException and why catching Throwable breaks cancellation; NonCancellable cleanup; withTimeout vs withTimeoutOrNull; exception propagation, coroutineScope vs supervisorScope, CoroutineExceptionHandler and exactly where it does and does not fire; async, lazy deferreds, awaitAll, exceptions inside async; dispatchers — Main, Main.immediate, IO, Default, the shared IO/Default pool, limitedParallelism, custom dispatchers, confinement vs locking; withContext semantics and cost; runBlocking and why it is banned in production code; builders compared; Mutex vs synchronized in suspending code; atomics and shared mutable state; Flow — cold streams, builders, terminal operators, context preservation and the flowOn rule, exception transparency and catch; intermediate operators (map/filter/transform/onEach/scan/debounce/sample/distinctUntilChanged/flatMapLatest/flatMapMerge/flatMapConcat/combine/zip/merge); backpressure with buffer/conflate/collectLatest; channelFlow and callbackFlow, awaitClose, trySend semantics; Channel types, capacity and BufferOverflow; StateFlow vs SharedFlow vs LiveData vs Channel for one-shot events; SharedFlow replay and extraBufferCapacity tuning; stateIn/shareIn and SharingStarted.WhileSubscribed(5000) — what the 5000 is really for and how it interacts with process death; conflation silently dropping values; repeatOnLifecycle vs flowWithLifecycle vs the deprecated launchWhenStarted; viewModelScope and lifecycleScope; collectAsStateWithLifecycle; retry/retryWhen with exponential backoff; select and racing; testing with runTest, StandardTestDispatcher vs UnconfinedTestDispatcher, virtual time and advanceUntilIdle, Turbine, injecting dispatchers for testability; interview traps around GlobalScope and leaked scopes.',
      },
      {
        track: 'compose', prefix: 'cmp', packTitle: 'Jetpack Compose', packBase: 'compose-g',
        gap: 64, startId: 12, chunk: 10, itemType: 'qa',
        existing: ['content/packs/compose-a.json', 'content/packs/compose-b.json', 'content/packs/compose-c.json'],
        outlineFile: '.claude/workflows/outlines/compose.json',
        reuseOutline: true,
        scope: 'Planned ~75 items total. Must cover: the compiler plugin, the injected $composer and $changed parameters, positional memoization and the slot table / gap buffer; Composer, Applier, Recomposer, and how recomposition scopes are chosen; donut-hole skipping; stability, @Stable/@Immutable, strong skipping and what it changed, stability inference across modules and the stability configuration file; State and the snapshot system, snapshot isolation, how reads are observed; remember vs rememberSaveable, custom Savers, keys and invalidation; derivedStateOf vs a plain calculation; the three phases and how lambda-taking modifiers skip recomposition; deferred reads and graphicsLayer; effect APIs — LaunchedEffect, DisposableEffect, SideEffect, rememberCoroutineScope, rememberUpdatedState, produceState, snapshotFlow — and choosing between them; effect keys; CompositionLocal static vs dynamic and when it is the wrong tool; state hoisting and stateless composables; ViewModel integration and collectAsStateWithLifecycle; modifier chain order semantics and cost; Modifier.Node, why composed{} is a performance smell, writing a node-backed modifier; custom layout with Layout, measure/place, intrinsics, why measuring a child twice throws, SubcomposeLayout cost; BoxWithConstraints; LazyColumn/LazyRow — key, contentType, item reuse, nested-scroll pitfalls, LazyLayout; nested scroll interop; text — font scaling, AnnotatedString, measurement cost; picking an animation API (animate*AsState, Animatable, updateTransition, AnimatedVisibility, AnimatedContent, Crossfade, infinite transitions) and animating without recomposing; gestures with pointerInput, drag and tap detectors, velocity, touch interop with Views; Navigation 3 (1.1.1) — back stack as observable state, NavDisplay, entry providers, scenes, how it differs from Navigation 2, navigationevent and predictive back; adaptive layouts, WindowSizeClass, canonical layouts, foldables; Material 3 theming and dynamic color; edge-to-edge and window insets; accessibility semantics, mergeDescendants, custom actions, testTag; View interop in both directions (AndroidView, ComposeView, ViewCompositionStrategy) and its lifecycle traps; performance tooling — Layout Inspector recomposition counts, composition tracing, compiler metrics and reports, baseline profiles for Compose; common jank sources; Compose testing — semantics queries, synchronization without sleeping, waitUntil, screenshot tests across theme and font scale; Compose Multiplatform differences; Glance for widgets.',
      },
    ],
  },

  wave2: {
    release: '2026.08.8',
    tracks: [
      {
        track: 'platform', prefix: 'pf', packTitle: 'Platform & Framework', packBase: 'platform-g',
        gap: 50, startId: 11, chunk: 10, itemType: 'qa',
        existing: ['content/packs/platform.json', 'content/packs/platform-b.json'],
        outlineFile: '.claude/workflows/outlines/platform.json',
        scope: 'Planned ~60 items total. Must cover: Activity/Fragment/Service/ContentProvider/BroadcastReceiver lifecycles and their real traps; the Fragment view-lifecycle vs Fragment lifecycle; configuration changes and what actually survives; process death, saved state, SavedStateHandle, and testing it; task and back stack, launch modes, taskAffinity, intent flags; the modern predictive-back and OnBackPressedDispatcher model; Binder, transaction buffer limits and TransactionTooLargeException, oneway calls, AIDL, Parcelable vs Serializable; Looper, Handler, MessageQueue, Choreographer, the frame pipeline and vsync; ANR anatomy — the five triggers, timeouts, reading a traces file, StrictMode; memory — the heap, GC behaviour, LeakCanary, common leak shapes, onTrimMemory, low-memory kills and the LMK; the app-startup sequence from zygote fork to first frame; app components declared in the manifest and exported-component safety; permissions — install-time vs runtime vs special, the request flow, rationale, one-time and partial media access, the Photo Picker; scoped storage, MediaStore, SAF, and the shared-storage migration; background execution limits, doze, app standby buckets, background start restrictions; foreground service types and the Android 14+ requirements, user-initiated data transfer; WorkManager — constraints, backoff, expedited work, chaining, uniqueness, testing; AlarmManager exact-alarm permission; JobScheduler relationship; notifications — channels, POST_NOTIFICATIONS, importance, full-screen intents; PendingIntent mutability; deep links, App Links and verification, intent filters, intent redirection risk; edge-to-edge enforcement and insets; per-app language and locale; dark theme and configuration; display cutouts, foldables, multi-window and resizability; Android 13, 14, 15, 16 and 17-beta behavior changes that break apps, with the Play targetSdk 36 deadline of 2026-08-31 and the 16 KB page-size requirement from 2027-02-01; local network access permission in 17; app links to Play policy and data safety; ART, JIT/AOT, profile-guided compilation, dex and 64K methods; NDK and JNI basics an Android engineer is expected to know.',
      },
      {
        track: 'architecture', prefix: 'ar', packTitle: 'Architecture & DI', packBase: 'architecture-g',
        gap: 43, startId: 8, chunk: 10, itemType: 'qa',
        existing: ['content/packs/architecture.json', 'content/packs/architecture-b.json'],
        outlineFile: '.claude/workflows/outlines/architecture.json',
        scope: 'Planned ~50 items total. Must cover: unidirectional data flow, what "state" means and where it lives; MVVM vs MVI vs MVP compared honestly, with when each is wrong; state holders — ViewModel vs plain state holder vs remembered holder; modeling UI state (single sealed state vs multiple fields), loading/error/empty, partial state; reducing state explosions; one-shot events and why SingleLiveEvent is an anti-pattern; navigation as state; SavedStateHandle and process death; the repository pattern — what belongs in it and what does not; single source of truth and NetworkBoundResource-style flows; whether a domain layer / use cases earn their place, argued both directions; mappers and the layer-boundary model problem (DTO vs domain vs UI model); error propagation across layers; offline-first architecture, sync strategies, conflict resolution, outbox and idempotency keys; caching policy and invalidation; dependency injection concepts — constructor injection, service locator vs DI, why not singletons; Hilt — components, scopes, entry points, assisted injection, qualifiers, testing with replacement bindings, common compile errors; Koin vs Hilt vs manual DI trade-offs; DI in KMP; multibindings and plugin architectures; modularization — by layer vs by feature, api vs implementation, the dependency graph, convention plugins, module boundaries that actually hold; public API surface of a module; feature toggles, staged rollout, kill switches; app scalability with many teams; the "God ViewModel" smell and how to split; threading policy in architecture; testability as an architectural property; clean-architecture dogma vs pragmatism at staff level; migrating a legacy codebase incrementally; how you would review an architecture proposal.',
      },
      {
        track: 'data-networking', prefix: 'dn', packTitle: 'Data, Networking & Persistence', packBase: 'data-networking-g',
        gap: 36, startId: 5, chunk: 9, itemType: 'qa',
        existing: ['content/packs/data-networking.json'],
        outlineFile: '.claude/workflows/outlines/data-networking.json',
        scope: 'Planned ~40 items total. Must cover: OkHttp internals — the interceptor chain (application vs network), connection pool, dispatcher, retries, cache semantics and Cache-Control; Retrofit — how the interface becomes calls, converters, call adapters, suspend support, error handling; token refresh done correctly with Authenticator and single-flighting concurrent 401s; certificate pinning, when it backfires, and the network security config; TLS, HTTP/2 and HTTP/3 on mobile, multiplexing, head-of-line blocking; request timeouts, retries with jitter, and idempotency; Ktor client as an alternative and for KMP; kotlinx.serialization vs Moshi vs Gson, polymorphic serialization, schema evolution and unknown fields; protobuf and payload size; GraphQL on mobile trade-offs; pagination protocols — offset vs cursor and why offset breaks; Room — entities, relations, DAO queries returning Flow, transactions, threading, indices and query plans, migrations (auto vs manual) and testing them, destructive fallback risk, full-text search, Room in KMP; SQLite basics an Android engineer must know — indices, EXPLAIN QUERY PLAN, WAL, N+1 queries; DataStore Preferences vs Proto, migration from SharedPreferences, why SharedPreferences apply() can still block; file storage, cache dir vs files dir, cleanup; encryption at rest — SQLCipher, Keystore-backed keys, the deprecation of Jetpack Security crypto; Paging 3 — PagingSource, RemoteMediator, RemoteKeys, invalidation, separators, testing; image loading with Coil — memory and disk tiers, sizing, eviction, and how you would design it; WebSockets and long-lived connections, reconnect and backoff; FCM data vs notification messages, delivery guarantees, payload limits; sync engines and background sync scheduling; network observability, metrics and debugging with a proxy; offline queueing and conflict resolution.',
      },
      {
        track: 'performance', prefix: 'pe', packTitle: 'Performance & App Health', packBase: 'performance-g',
        gap: 37, startId: 4, chunk: 9, itemType: 'qa',
        existing: ['content/packs/performance.json'],
        outlineFile: '.claude/workflows/outlines/performance.json',
        scope: 'Planned ~40 items total. Must cover: startup — cold vs warm vs hot, the phases from process fork to first frame, TTID vs TTFD, reportFullyDrawn, App Startup library, what to never do in Application.onCreate, content-provider init cost, splash-screen API; Baseline Profiles and Startup Profiles — what they actually do, generating them, verifying they applied, CI integration; R8 — full mode, shrinking, obfuscation, keep rules that are too broad, resource shrinking, mapping files, debugging a release-only crash; jank — the 16.6ms/8.3ms budget at 60/90/120Hz, frame lifecycle, dropped vs frozen frames, JankStats, the difference between UI-thread and RenderThread jank; Perfetto and systrace — capturing, reading a trace, finding the long slice, custom trace sections; Macrobenchmark and Microbenchmark — writing one, CompilationMode, avoiding measurement mistakes, running in CI; Compose-specific performance — recomposition counts, unstable parameters, expensive composition; layout performance in Views (overdraw, nested weights) for legacy code; memory — profiling with Memory Profiler, heap dumps, bitmap cost and sampling, memory leaks and their shapes, native memory, OOM vs LMK kill; ANR and freezing as a performance problem; battery — wakelocks, jobs, network batching, Battery Historian, the Play Console excessive-wakeup metric; network performance — payload size, compression, connection reuse, prefetch vs waste; app size — APK vs AAB, dynamic feature and on-demand delivery, resource configuration splits, asset packs, what actually moves install conversion; disk I/O on the main thread and StrictMode; Android Vitals — the specific bad-behaviour thresholds and how they gate discovery; setting a performance budget, regression detection, and how you would run a performance workstream on a large team; profiling in production with tracing and sampling.',
      },
    ],
  },

  wave3: {
    release: '2026.08.9',
    tracks: [
      {
        track: 'build-testing', prefix: 'bt', packTitle: 'Build, Tooling & Testing', packBase: 'build-testing-g',
        gap: 58, startId: 3, chunk: 10, itemType: 'qa',
        existing: ['content/packs/build-testing.json'],
        outlineFile: '.claude/workflows/outlines/build-testing.json',
        scope: 'Planned ~60 items total, split roughly half BUILD and half TESTING. BUILD (~29): Gradle fundamentals — configuration vs execution phase, task graph, up-to-date checks, incremental tasks, task inputs/outputs; the configuration cache and what breaks it, the build cache (local and remote), parallel and isolated projects; why a clean build is not a fix; AGP 9.3 — built-in Kotlin support with no separate kotlin.android plugin, what that migration involves, the AGP DSL and Variant API; version catalogs and dependency management, BOMs, resolution strategy, dependency locking, catching conflicting transitive versions; convention plugins in buildSrc vs an included build, and why buildSrc invalidates everything; multi-module build performance and measuring it with build scans; KSP2 vs kapt — why kapt is a build-time tax, migrating, annotation processors that still lack KSP; product flavors, build types, source sets, variant-aware dependencies; signing, Play App Signing, key rotation; ProGuard/R8 rule authoring and consumer rules for libraries; publishing a library module; reproducible builds and supply-chain concerns, dependency verification; lint — custom rules, baselines, CI gating; detekt and ktlint/Spotless; CI pipelines for Android, sharding, caching, emulator vs Gradle Managed Devices, flake quarantine; release automation and staged rollout. TESTING (~29): the pyramid and what it means on Android specifically; JVM unit tests vs instrumented tests vs Robolectric — cost and fidelity trade-offs; fakes vs mocks vs stubs and why over-mocking rots a suite; Mockito/MockK and their Kotlin pitfalls (final classes, coroutines); testing coroutines with runTest, TestScope, virtual time and dispatcher injection; testing Flows with Turbine and with a plain collector; testing ViewModels and SavedStateHandle; testing Room and migrations; testing WorkManager; testing Retrofit with MockWebServer; Hilt testing with test components and replaced bindings; Compose UI testing — semantics tree, finders, synchronization, waitUntil, testing with an idling resource; Espresso for legacy screens and its interop with Compose; screenshot testing (Roborazzi/Paparazzi/Compose screenshot tests) and how to keep goldens sane across theme and font scale; UI Automator and end-to-end tests; test doubles for time and randomness; parameterized tests; test naming and readability; flakiness — root causes, detection, retry policy and why retries hide bugs; coverage as a metric and its abuse; TDD in practice on Android; how you would introduce testing into an untested legacy codebase; what you would gate a PR on.',
      },
      {
        track: 'security-kmp', prefix: 'sk', packTitle: 'Security, KMP & Modern Android', packBase: 'security-kmp-g',
        gap: 67, startId: 4, chunk: 10, itemType: 'qa',
        existing: ['content/packs/security-kmp.json'],
        outlineFile: '.claude/workflows/outlines/security-kmp.json',
        scope: 'Planned ~70 items total across THREE areas, roughly balanced. SECURITY & PRIVACY (~23): the Android security model, UID sandboxing, SELinux; Android Keystore, hardware-backed keys, StrongBox, key attestation, setUserAuthenticationRequired; encrypting data at rest and the deprecation of Jetpack Security crypto — what to use now; biometric authentication with BiometricPrompt, CryptoObject, class 2 vs class 3, fallbacks; Play Integrity API vs the old SafetyNet, what it does and does not prove; root and tamper detection realism; exported components and the intent-redirection vulnerability; PendingIntent mutability and FLAG_IMMUTABLE; deep-link and App-Link hijacking; WebView security — JavaScript interfaces, file access, safe browsing, loading untrusted content; certificate pinning and the network security config; secrets in the APK and why there is no client-side secret; obfuscation as defense in depth, not security; clipboard, screenshots and FLAG_SECURE, screen recording; permissions as a privacy surface, data minimization, the Play Data Safety form; MASVS/OWASP MASTG as a framework for answering "how would you secure this app"; threat modeling a mobile feature; handling a reported vulnerability. KOTLIN MULTIPLATFORM & CMP (~23): what KMP shares and what it does not; expect/actual, and why interfaces plus platform factories are often better; source-set hierarchy and the default hierarchy template; Gradle setup for a KMP module; consuming platform SDKs, cinterop, and Objective-C interop limits; the Kotlin/Native memory model after the new one landed, and freezing being gone; concurrency in Native, Dispatchers.Main on iOS; exposing suspend functions and Flows to Swift, SKIE and the Swift export work; KMP-ready Jetpack libraries (Room, DataStore, ViewModel, Paging, Lifecycle) and what they buy; Ktor and kotlinx.serialization as the shared networking stack; SQLDelight vs Room in KMP; DI in KMP; testing shared code; build times and CI for KMP; Compose Multiplatform 1.11 for iOS — what is stable, what still differs, when to use it vs SwiftUI; sharing UI vs sharing logic as a team decision; KMP vs Flutter vs React Native vs native, argued with real trade-offs; incrementally adopting KMP in a shipping app; how you would sell KMP to an iOS team. MODERN ANDROID (~21): on-device AI — ML Kit GenAI APIs, Gemini Nano and AICore, on-device vs cloud trade-offs, prompt and output handling, model download and size; Credential Manager and passkeys, migrating from Smart Lock and one-tap sign-in; Health Connect; Media3/ExoPlayer architecture, adaptive streaming, DRM, background playback and MediaSession; CameraX use cases, image analysis, Camera2 interop; Glance app widgets; Wear OS, TV, Auto and XR — what changes about your architecture; Play Billing and subscriptions; in-app updates and in-app review; App Bundles, Play Feature Delivery and Play Asset Delivery; Play policies that gate releases; Firebase and Crashlytics in a modern stack; the Privacy Sandbox on Android and the advertising-ID changes; large-screen and foldable quality guidelines; accessibility as a shipping requirement; what you would put on a 2026 Android tech-radar and why.',
      },
    ],
  },

  wave4: {
    release: '2026.08.10',
    tracks: [
      {
        track: 'dsa', prefix: 'ds', packTitle: 'Problem Solving', packBase: 'dsa-g',
        gap: 41, startId: 20, chunk: 7, itemType: 'dsa',
        existing: ['content/packs/dsa.json', 'content/packs/dsa-b.json', 'content/packs/dsa-c.json'],
        outlineFile: '.claude/workflows/outlines/dsa.json',
        scope: 'Planned ~60 problems total. Cover every pattern an Android interview loop actually uses, each with a distinct, classic-but-not-duplicated problem: arrays and hashing; two pointers (opposite ends and fast/slow); sliding window fixed and variable; prefix sums and difference arrays; binary search on a sorted array AND binary search on the answer; sorting-based problems and custom comparators; intervals (merge, insert, meeting rooms, minimum rooms); monotonic stack and monotonic deque; stacks and parsing; heaps and top-K, two-heaps median; linked lists (reverse, cycle, merge, reorder, LRU via list+map); trees (traversals iterative and recursive, BST operations, LCA, diameter, serialize/deserialize, level order, path sums); tries (insert/search, prefix autocomplete, word search); graphs (BFS/DFS, grid flood fill, shortest path in unweighted, Dijkstra, topological sort and cycle detection, union-find with path compression, connected components, bipartite check); backtracking (subsets, permutations, combination sum, N-queens, word search); greedy with an exchange argument; dynamic programming (1-D climbing/house-robber, coin change, LIS, 0/1 knapsack, 2-D grid paths, edit distance, longest common subsequence, palindromic substrings, DP on intervals) including the space-optimization step; bit manipulation; math and overflow care; string algorithms (anagram grouping, palindrome checks, parsing, run-length); design problems (LRU cache, rate limiter, min stack, hit counter, iterator). ALSO — and these matter most for this loop — Android-flavored coding tasks: debounced search with Flow, a paginated list with retry and error state, an image memory cache with LRU eviction, an offline mutation/sync queue, a custom Compose layout, implementing a minimal LiveData or StateFlow, a thread-safe in-memory store, exponential backoff with jitter, a single-flight request deduplicator, parsing a large JSON stream without OOM, an event bus, and a bounded work queue. Levels: keep a real spread, some level 1 and 2 warm-ups through level 4 hard problems.',
      },
      {
        track: 'system-design', prefix: 'sd', packTitle: 'Mobile System Design', packBase: 'system-design-g',
        gap: 14, startId: 5, chunk: 4, itemType: 'design',
        existing: ['content/packs/system-design.json', 'content/packs/system-design-b.json'],
        outlineFile: '.claude/workflows/outlines/system-design.json',
        scope: 'Planned ~19 scenarios total (one of which is the framework item sd-0000, already written). The four already covered are: an offline-capable social feed, an offline-first messaging app, offline media downloads, and designing an analytics SDK — DO NOT repeat those. Write these fourteen, one per item, each a full 45-minute scenario: (1) Google Photos-style background photo backup — chunked resumable upload, dedup, battery and metered-network policy; (2) Uber-style live location tracking and sharing — streaming updates, battery, accuracy, foreground service; (3) an offline-first news reader with conflict resolution and content freshness; (4) Dropbox-style file sync — a real sync engine with conflict detection, deltas and tombstones; (5) push notifications at scale with FCM — delivery guarantees, dedup, deep links, quiet hours, token lifecycle; (6) design an image-loading library (Coil-class) — API surface, cache tiers, request lifecycle, cancellation; (7) design a networking library (Retrofit-class) — interface-to-call mapping, interceptors, adapters, testability; (8) a video streaming client — adaptive bitrate, prefetch, DRM, resume, data budget; (9) a checkout and payment flow with idempotency, retries and fraud-adjacent constraints; (10) offline maps and turn-by-turn navigation — tiles, storage budget, routing offline; (11) modularizing a large app for 200 engineers — build times, ownership, API boundaries, migration plan; (12) a feature-flag and A/B experimentation system on the client — evaluation, consistency, kill switches, exposure logging; (13) a crash-reporting and observability SDK — capturing, symbolication, sampling, privacy, upload policy; (14) a real-time collaborative editor on mobile — CRDT vs OT, presence, offline edits, reconnection. Give each a level of 3 or 4 (the SDK and infrastructure ones lean 4).',
      },
      {
        track: 'behavioral', prefix: 'bh', packTitle: 'Behavioral & Interview Craft', packBase: 'behavioral-g',
        gap: 22, startId: 4, chunk: 11, itemType: 'qa',
        existing: ['content/packs/behavioral.json'],
        outlineFile: '.claude/workflows/outlines/behavioral.json',
        scope: 'Planned ~25 items total. Must cover: the STAR structure done well and the common ways it is done badly; building a story bank and mapping one story to several questions; scoping a story to the right altitude for senior vs staff; quantifying impact honestly; the classic prompts, each as its own item with a model structure and a worked example — tell me about a failure; a conflict with a colleague; disagreeing with your manager; a project that slipped and what you did; taking ownership beyond your remit; mentoring someone; giving difficult feedback; receiving critical feedback; influencing without authority; a technical decision you got wrong; a time you pushed back on a product requirement; handling an on-call incident or production outage; working with an underperforming teammate; navigating ambiguity with no clear owner; prioritizing under a hard deadline; saying no. Also: Google/Meta/Amazon flavour differences and Amazon Leadership Principles mapping; how staff-level answers differ from senior ones (scope, leverage, org impact); communicating during live coding — narrating, handling being stuck, taking hints gracefully; asking clarifying questions in a design round; what questions to ask your interviewer and what the answers tell you; discussing compensation and the basics of negotiating an offer; explaining a gap, a layoff or a short tenure; the closing pitch — why this company, why you.',
      },
    ],
  },
}

// args may arrive as a real object, a JSON string, a wave name, or "wave:track".
// The track filter exists so a big wave can be run one track at a time — usage limits
// are per-window, and a whole wave in one go is enough to hit one.
let A = typeof args === 'string' ? args.trim() : args
if (typeof A === 'string' && A.startsWith('{')) A = JSON.parse(A)
if (typeof A === 'string') {
  const [waveName, only] = A.split(':')
  if (!WAVES[waveName]) throw new Error('unknown wave "' + waveName + '" — expected one of: ' + Object.keys(WAVES).join(', '))
  A = WAVES[waveName]
  if (only) {
    const picked = A.tracks.filter((t) => t.track === only)
    if (!picked.length) {
      throw new Error('wave "' + waveName + '" has no track "' + only + '" — has: ' + A.tracks.map((t) => t.track).join(', '))
    }
    A = { ...A, tracks: picked }
  }
}
A = A || {}

const RELEASE = A.release
const CHECKED = A.checked || '2026-08-07'
const TRACKS = A.tracks || []

if (!RELEASE) throw new Error('args must be a wave name (' + Object.keys(WAVES).join(' | ') + ') or {release, tracks}')
if (!TRACKS.length) throw new Error('args.tracks must be a non-empty array')

const pad = (n) => String(n).padStart(4, '0')
const chunkBy = (arr, n) => {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

// ---------------------------------------------------------------- schemas

const OUTLINE_SCHEMA = {
  type: 'object',
  required: ['specs'],
  properties: {
    specs: {
      type: 'array',
      items: {
        type: 'object',
        required: ['topic', 'level', 'type', 'q', 'angle'],
        properties: {
          topic: { type: 'string', description: 'Topic bucket, reuse existing topic names in this track where they fit' },
          level: { type: 'integer', minimum: 1, maximum: 4 },
          type: { type: 'string', enum: ['qa', 'concept', 'dsa', 'design'] },
          q: { type: 'string', description: 'The interview question / problem title, final wording' },
          angle: { type: 'string', description: '1-2 sentences: the specific insight this item must land, so the author does not drift' },
          pattern: { type: 'string', description: 'dsa items only: the algorithmic pattern tag' },
        },
      },
    },
    coverageNotes: { type: 'string' },
  },
}

const AUTHOR_SCHEMA = {
  type: 'object',
  required: ['file', 'packId', 'count', 'ids'],
  properties: {
    file: { type: 'string' },
    packId: { type: 'string' },
    count: { type: 'integer' },
    ids: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  required: ['filesChecked', 'issuesFound', 'issuesFixed'],
  properties: {
    filesChecked: { type: 'integer' },
    issuesFound: { type: 'integer' },
    issuesFixed: { type: 'integer' },
    fixed: { type: 'array', items: { type: 'string' }, description: 'one line per fix: "id — what was wrong"' },
    unresolved: { type: 'array', items: { type: 'string' } },
  },
}

// ---------------------------------------------------------------- shared contract

const HOUSE_RULES = [
  'PROJECT: ' + ROOT + ' — a static, offline-first Android interview-prep site. Content lives in versioned JSON packs.',
  '',
  'THE STACK SNAPSHOT IS THE SINGLE SOURCE OF TRUTH FOR ALL VERSION CLAIMS. Read content/manifest.json',
  '-> stackSnapshot before you write anything, and never contradict it. Today is ' + CHECKED + '.',
  'Key facts: Kotlin 2.4.0; Compose BOM 2026.04.01 / core 1.11.0; Navigation 3 1.1.1 stable; AGP 9.3.0',
  '(built-in Kotlin support, no kotlin.android plugin); Android 16 shipped, 17 in beta; targetSdk 36',
  'required by 2026-08-31; 16 KB page sizes enforced for updates from 2027-02-01; CMP 1.11.0.',
  '',
  'QUALITY BAR — this is a senior/staff interview weapon, not a tutorial. Every item must be something a',
  'strong candidate could be asked and a weak one would fumble. Specifically:',
  '  - No filler, no "what is X" definitions unless level 1 and genuinely asked.',
  '  - Depth over breadth inside each item: mechanism, not vocabulary. Say WHY, name the internals.',
  '  - Concrete numbers, API names, and failure modes beat adjectives.',
  '  - Kotlin code must be realistic and compile-plausible. No pseudo-code, no "// ..." standing in for the point.',
  '  - "traps" is the highest-value field: what actually gets people rejected on this question.',
  '',
  'REFS — 1-2 per item, official sources only (developer.android.com, kotlinlang.org, kotlin.github.io,',
  'square.github.io, source.android.com, developer.android.com/jetpack, github.com/<official org>).',
  'Every ref needs "checked": "' + CHECKED + '". Cite the STABLE CANONICAL PAGE, not a deep anchor you are',
  'not certain exists — a wrong URL is worse than a general one. Never invent a URL.',
  '',
  'HARD RULES:',
  '  - Do NOT touch content/manifest.json. Do NOT touch existing pack files. Do NOT touch content/plans/.',
  '  - Write ONLY the pack file(s) assigned to you.',
  '  - Use the EXACT item ids assigned to you, in order. Never invent, renumber, or reuse an id.',
  '  - Every item gets "addedIn": "' + RELEASE + '".',
  '  - Output valid JSON (UTF-8, real characters not \\u escapes is fine; no trailing commas, no comments).',
].join('\n')

const ITEM_SHAPE_QA = [
  'ITEM SHAPE for type "qa" / "concept" — mirror content/packs/kotlin-a.json item kt-0003 exactly:',
  '  id, track, topic, level (1 Basics | 2 Mid-Level | 3 Senior | 4 Staff/Monster), type,',
  '  tags: 2-4 lowercase kebab tags,',
  '  q: the question as an interviewer would ask it,',
  '  shortAnswer: exactly 3 bullets you could SAY OUT LOUD in the room — full sentences, no notes-speak,',
  '  answer: 250-550 words of markdown. Use #### subheads. Tables and short fenced blocks are fine.',
  '  code: 1-2 entries {lang:"kotlin", caption, src} — real code, tabs as 4 spaces, comments that teach,',
  '  followUps: 2-3 questions the interviewer would push with next,',
  '  traps: 2-3 entries — the specific wrong answers / omissions that lose the offer,',
  '  refs: [{title, url, checked}],',
  '  addedIn.',
  '("concept" items — cheat-sheet style — may omit shortAnswer/code/followUps/traps and carry a dense answer.)',
].join('\n')

const ITEM_SHAPE_DSA = [
  'ITEM SHAPE for type "dsa" — mirror content/packs/dsa.json item ds-0001 exactly:',
  '  id, track, topic, level, type:"dsa", pattern (REQUIRED — the algorithmic pattern), tags,',
  '  q: short problem title,',
  '  prompt: the problem statement in markdown, PLUS a paragraph on what the interviewer is really testing,',
  '  hints: exactly 3, strictly progressive — nudge, then the key insight, then the mechanism. Hint 1 must',
  '         not give away hint 3.',
  '  code: 1-2 {lang:"kotlin", caption, src} — the optimal solution, idiomatic Kotlin, correct on edge cases,',
  '  complexity: time + space for the optimal AND the brute force, with the trade-off stated,',
  '  followUps: 2-3 real interviewer follow-ups (variants, constraints changes, scale),',
  '  starter: a Kotlin function signature stub with a "// your solution" body,',
  '  addedIn.',
  'No refs field on dsa items. Android-flavored problems (debounced search, image cache, sync queue,',
  'custom layout, build-a-LiveData) are first-class here — they separate Android candidates from LeetCoders.',
].join('\n')

const ITEM_SHAPE_DESIGN = [
  'ITEM SHAPE for type "design" — mirror content/packs/system-design.json item sd-0001 exactly. Read that',
  'file first; it is long and you must match its depth, not summarise it.',
  '  id, track, topic, level, type:"design", timerMinutes: 45, tags,',
  '  q: "Design ..." one-liner,',
  '  prompt: scenario + explicit scale/constraints + "Set a 45-minute timer and talk out loud.",',
  '  framework: 1-3 sentences on where THIS scenario differs from the generic framework (sd-0000),',
  '  requirements: 12-16 checklist strings the candidate ticks live,',
  '  referenceAnswer: 700-1200 words of markdown with #### subheads — architecture, data model, protocol,',
  '                   offline/failure handling, battery+data budget, observability, explicit trade-offs,',
  '  rubric: 10-14 scoring lines,',
  '  staffAdds: 4-6 lines on what a STAFF answer adds beyond senior,',
  '  diagram: an inline SVG string. Copy the structure and CSS class names (dg-box--blue, dg-label, dg-sub,',
  '           dg-arrow, marker id dgArrow) from sd-0001 so it themes correctly. viewBox "0 0 720 300"-ish,',
  '           role="img", aria-label. Boxes + labelled arrows only — no colours hardcoded.',
  '  addedIn.',
].join('\n')

function shapeFor(t) {
  if (t.track === 'dsa') return ITEM_SHAPE_DSA
  if (t.track === 'system-design') return ITEM_SHAPE_DESIGN
  return ITEM_SHAPE_QA
}

// ---------------------------------------------------------------- prompts

function outlinePrompt(t) {
  return [
    HOUSE_RULES,
    '',
    '=== YOUR JOB: OUTLINE ONLY. Write no pack files. ===',
    '',
    'Track: "' + t.track + '" (' + t.packTitle + '). This track has ' + t.existing.length + ' existing pack file(s)',
    'holding items already written. It must reach the planned size, so you are planning exactly ' + t.gap + ' NEW items.',
    '',
    'STEP 1 — read every existing file for this track and list the questions already covered:',
    t.existing.map((f) => '  ' + f).join('\n'),
    'Nothing you plan may duplicate or near-duplicate one of those. Overlap is the #1 failure mode here.',
    '',
    'STEP 2 — the planned scope for this track (from the original build plan):',
    t.scope,
    '',
    'STEP 3 — return exactly ' + t.gap + ' specs. Requirements:',
    '  - Cover the whole planned scope above. If the scope names a subject, it MUST appear.',
    '  - Level mix across the ' + t.gap + ': roughly 10% level 1, 30% level 2, 40% level 3, 20% level 4.',
    '    Level 4 items must be genuinely staff-grade — internals, trade-offs at scale, "argue both sides".',
    '  - Reuse existing topic names in this track where they fit; invent new ones only for genuinely new areas.',
    '  - Order the specs so related items are adjacent (they get chunked in order, so a chunk stays coherent).',
    '  - "angle" is a contract with the author: name the specific insight, trap, or mechanism that item exists',
    '    to teach. Vague angles produce filler items. Be concrete: name the API, the failure mode, the number.',
    '  - Every spec type must be "' + (t.itemType || 'qa') + '".',
    '',
    'STEP 4 — before you return, WRITE your plan to ' + t.outlineFile + ' with the Write tool,',
    'as exactly {"specs": [ ... ]} — the same array you are about to return, same order.',
    'This is a checkpoint: authoring runs out of that file, so if the authors are interrupted the',
    'plan survives and nobody has to redo it. Then return the specs array.',
    '',
    'Do not assign ids — the harness assigns them positionally from your ordering.',
  ].join('\n')
}

function authorHead(t, packId, file, n) {
  return [
    HOUSE_RULES,
    '',
    '=== YOUR JOB: WRITE ONE PACK FILE ===',
    '',
    'Create ' + file + ' with exactly this envelope:',
    '  { "id": "' + packId + '", "title": "' + t.packTitle + '", "track": "' + t.track + '", "items": [ ... ] }',
    'containing exactly ' + n + ' items.',
    '',
    'STEP 1 — read for house style and depth (do not copy content, copy the BAR):',
    '  ' + t.existing[0],
    '  content/manifest.json  (stackSnapshot)',
  ].join('\n')
}

const authorTail = [
  'You may sharpen the wording of "q" but never change the subject. Hit the "angle" for every item —',
  'it is the reason the item exists. If two of your items would say the same thing, differentiate them',
  'rather than padding both.',
  '',
  'Write the file with the Write tool, then verify it parses (python3 -c "import json;json.load(open(...))").',
  'Return only the summary object — never the item JSON.',
].join('\n')

// specs handed over inline (the outline agent just produced them)
function authorPrompt(t, packId, file, specs) {
  return [
    authorHead(t, packId, file, specs.length),
    '',
    'STEP 2 — write these ' + specs.length + ' items, in this order, with these exact ids:',
    '',
    specs.map((s, i) =>
      [
        (i + 1) + '. id: ' + s.id,
        '   topic: ' + s.topic + '   level: ' + s.level + '   type: ' + s.type + (s.pattern ? '   pattern: ' + s.pattern : ''),
        '   q: ' + s.q,
        '   angle: ' + s.angle,
      ].join('\n')
    ).join('\n\n'),
    '',
    shapeFor(t),
    '',
    authorTail,
  ].join('\n')
}

// specs already on disk from an earlier run — the author reads its own slice, so the
// specs never round-trip through a model and cannot be paraphrased or dropped.
function authorPromptFromFile(t, packId, file, from, to, ids) {
  return [
    authorHead(t, packId, file, ids.length),
    '',
    'STEP 2 — read the outline at:',
    '  ' + t.outlineFile,
    'It is {"specs": [...]} — a pre-approved plan for this whole track. Take ONLY the slice at',
    '0-based indices ' + from + ' through ' + to + ' inclusive (' + ids.length + ' specs). Ignore every other index:',
    'other agents are writing those, and duplicating them corrupts the set.',
    '',
    'Write one item per spec, IN ORDER, mapping index -> id exactly like this:',
    ids.map((id, i) => '  index ' + (from + i) + '  ->  ' + id).join('\n'),
    '',
    'Each spec carries topic, level, type' + (t.itemType === 'dsa' ? ', pattern' : '') + ', q and angle. Use them as given —',
    '"angle" names the specific insight that item exists to teach, and is the contract you must hit.',
    '',
    shapeFor(t),
    '',
    authorTail,
  ].join('\n')
}

function reviewPrompt(t, files) {
  return [
    HOUSE_RULES,
    '',
    '=== YOUR JOB: ADVERSARIAL REVIEW AND FIX IN PLACE ===',
    '',
    'These pack files were just written by separate agents who could not see each other:',
    files.map((f) => '  ' + f).join('\n'),
    'Pre-existing files for the same track (read-only reference, DO NOT EDIT):',
    t.existing.map((f) => '  ' + f).join('\n'),
    '',
    'Hunt for these, in priority order, and FIX what you find by editing the new files:',
    '  1. TECHNICAL ERRORS. Read the Kotlin and the prose like a staff engineer trying to fail the author.',
    '     Wrong API names, code that would not compile, wrong semantics (cancellation, threading, lifecycle,',
    '     recomposition, SQL), advice that is outdated. This is the highest-value pass — be genuinely skeptical.',
    '  2. VERSION DRIFT. Any claim about a version, deadline, or "new in X" that contradicts manifest.json',
    '     stackSnapshot, or that asserts something you are not confident is true as of ' + CHECKED + '.',
    '     When unsure, rewrite to be version-neutral rather than leaving a confident wrong claim.',
    '  3. DUPLICATION. Across the new files AND against the pre-existing ones. Two items answering the same',
    '     question: rewrite the weaker one onto an uncovered angle from the track scope, keeping its id.',
    '  4. SUSPECT URLS. Any ref url that looks invented or is a deep anchor unlikely to exist — replace with',
    '     the stable canonical doc page. Every ref needs checked: "' + CHECKED + '".',
    '  5. SCHEMA. Required fields present; level in 1-4; addedIn is "' + RELEASE + '"; track is "' + t.track + '";',
    '     dsa items have a pattern; shortAnswer is 3 sayable sentences; traps are real rejection reasons and',
    '     not restatements of the answer.',
    '  6. FLUFF. Any item that would not actually be asked, or whose answer is a definition dressed up as',
    '     depth — rewrite it into something with teeth, keeping its id.',
    '',
    'Do not rewrite items that are already good — this is a defect pass, not a rewrite pass.',
    'Leave every file valid JSON; verify each parses before you finish. Do not touch manifest.json.',
    'Report honestly: if you found nothing in a category, say so rather than inventing fixes.',
  ].join('\n')
}

// ---------------------------------------------------------------- run

log(RELEASE + ' — filling ' + TRACKS.reduce((n, t) => n + t.gap, 0) + ' items across ' + TRACKS.length + ' track(s)')

const results = await pipeline(
  TRACKS,

  // 1. plan the exact missing items. Skipped when a prior run already checkpointed the
  //    outline to disk (reuseOutline); otherwise the outline agent writes that checkpoint
  //    itself, so an interrupted authoring stage never costs the planning work twice.
  (t) => (t.reuseOutline ? { fromFile: true } : agent(outlinePrompt(t), {
    label: 'outline:' + t.track + ' (' + t.gap + ')',
    phase: 'Outline',
    schema: OUTLINE_SCHEMA,
  })),

  // 2. fan out authors over id-assigned chunks
  (outline, t) => {
    let chunks

    if (outline && outline.fromFile) {
      // ids are positional, so index ranges are all the author needs
      chunks = []
      for (let i = 0; i < t.gap; i += t.chunk) {
        const to = Math.min(i + t.chunk, t.gap) - 1
        const ids = []
        for (let k = i; k <= to; k++) ids.push(t.prefix + '-' + pad(t.startId + k))
        chunks.push({ from: i, to, ids })
      }
      log(t.track + ': reusing outline from ' + t.outlineFile + ' (' + t.gap + ' specs, ' + chunks.length + ' packs)')
    } else {
      const planned = (outline && outline.specs ? outline.specs : []).slice(0, t.gap)
      if (!planned.length) throw new Error('no specs returned for ' + t.track)
      if (planned.length < t.gap) log('! ' + t.track + ': outline returned ' + planned.length + '/' + t.gap + ' specs')
      chunks = chunkBy(planned.map((s, i) => ({ ...s, id: t.prefix + '-' + pad(t.startId + i) })), t.chunk)
    }

    return parallel(
      chunks.map((chunk, ci) => () => {
        const packId = t.packBase + '-' + (ci + 1)
        const file = 'content/packs/' + packId + '.json'
        const ids = chunk.ids || chunk.map((s) => s.id)
        const prompt = chunk.ids
          ? authorPromptFromFile(t, packId, file, chunk.from, chunk.to, chunk.ids)
          : authorPrompt(t, packId, file, chunk)
        return agent(prompt, {
          label: 'write:' + packId + ' [' + ids[0] + '..' + ids[ids.length - 1] + ']',
          phase: 'Author',
          schema: AUTHOR_SCHEMA,
        })
      })
    ).then((wrote) => ({ planned: t.gap, wrote: wrote.filter(Boolean), chunks: chunks.length }))
  },

  // 3. one skeptic per track, fixing in place
  (built, t) => {
    const files = built.wrote.map((w) => w.file)
    if (!files.length) return { track: t.track, ...built, review: null }
    return agent(reviewPrompt(t, files), {
      label: 'review:' + t.track,
      phase: 'Review',
      schema: REVIEW_SCHEMA,
      effort: 'high',
    }).then((review) => ({ track: t.track, ...built, review }))
  }
)

const ok = results.filter(Boolean)
const packs = ok.flatMap((r) =>
  r.wrote.map((w) => ({ packId: w.packId, file: w.file, track: r.track, count: w.count }))
)

return {
  release: RELEASE,
  totalItems: packs.reduce((n, p) => n + p.count, 0),
  perTrack: ok.map((r) => ({
    track: r.track,
    planned: r.planned,
    written: r.wrote.reduce((n, w) => n + w.count, 0),
    packs: r.wrote.length,
    issuesFound: r.review ? r.review.issuesFound : null,
    issuesFixed: r.review ? r.review.issuesFixed : null,
    unresolved: r.review ? r.review.unresolved || [] : [],
  })),
  // everything the manifest update needs, in order
  newPacks: packs,
  failedTracks: TRACKS.filter((t) => !ok.some((r) => r.track === t.track)).map((t) => t.track),
}
