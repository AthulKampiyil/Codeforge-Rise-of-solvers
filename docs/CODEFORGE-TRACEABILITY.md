# CodeForge requirement traceability

Source: `Group7_CodeForge_SRS (1).pdf` v1.0 and `Group_7_CodeForge_SADD(3).docx` v1.1 in this directory. This is a concise living matrix, **not** a declaration of production readiness. Statuses: **V** implemented with relevant executed test evidence, **U** implemented but not fully verified, **P** partial, **M** missing, **B** blocked by external decision/operation, **D** approved deferment, **C** conflicting specification. File paths are relative to repository root. Prior backend and frontend suites passed, but live judge/load/production claims remain unverified. See status file for dates/commands.

| ID · SRS location | Required behavior / module | Frontend · backend · persistence | Status; evidence; gap / dependency |
|---|---|---|---|
| REQ-1.1 · §4.1 p11 | Unique registration · M1 | `src/cp/ui/index.ts`; `backend/app/modules/m1_auth/service.py`; `users` | U; `test_m1_auth.py`; concurrent registration/UI acceptance pending. |
| REQ-1.2 · §4.1 p11 | Login/invalid credentials · M1 | CP auth; M1 service/router; users | U; M1 tests; integrated browser lifecycle pending. |
| REQ-1.3 · §4.1 p11 | Link supported judge · M1/M2 | CF panel; M1 link, M2 CF adapter; judge_accounts | U/D; CF path and unsupported-provider rejection tested; live CF proof remains unverified. LeetCode/CodeChef deferred. |
| REQ-1.4 · §4.1 p11 | Prove profile ownership · M1 | CF proof UI; M1 verify; verified identity index | U; M1 tests; live CF compatibility pending. |
| REQ-1.5 · §4.1 p11 | Link additional/unlink · M1 | CP unlink; M1 service; immutable solve/reward relations | P; history-bearing account cannot unlink; provenance/relink decision. |
| REQ-1.6 · §4.1 p11 | ≥7-day session/logout · M1 | `src/cp/client.ts`; M1 sessions/migration 021 | V for test scenarios; `test_m1_durable_sessions.py`; production cutover/recovery unverified. |
| REQ-2.1 · §4.2 p12 | Scheduled sync · M2 | status panel; `backend/worker/main.py`, M2 scheduler/checkpoints | U; M2/worker tests; real CF schedule pending. |
| REQ-2.2 · §4.2 p13 | Manual sync ≤1/5 min/account · M2 | CP refresh; M2 router/checkpoint/requested_at | V for tested cases; ≥300s in every environment, repeated/boundary and independent-session concurrency tests; production load unverified. |
| REQ-2.3 · §4.2 p13 | Tag each new solve · M2 | topic cards; M2 tagger/importer; solved_problem/progress | U; M2 tests; unknown tags and real history acceptance. |
| REQ-2.4 · §4.2 p13 | Last successful sync and status · M2 | CP status; M2 status/log/checkpoint | P; due-versus-running/failed status tests pass; live partial failures and freshness still need verification. |
| REQ-2.5 · §4.2 p13 | Outage/rate-limit preserves prior data · M2 | stale/error UI; M2 retry/DLQ/checkpoint | U; M2 tests; live outage/429/restart validation. |
| REQ-3.1 · §4.3 p13 | Topic levels from verified solves · M3 | village projection; M2 reconciler/M3 progress | U; composed Postgres + mocked-CF HTTP test proves import→level→API and duplicate-safe repeat; live CF end-to-end still unverified. |
| REQ-3.2 · §4.3 p13 | Earned level changes structure state · M3 | `src/game/scene.ts`, `src/cp/village-presentation.ts`; M3 levels/outpost tiers | U; earned-level art/scale and level-zero styling tested in helper/model; browser screenshot lacks side-by-side level comparison. |
| REQ-3.3 · §4.3 p13 | Aggregate defense rating · M3 | HUD/CP; `m3_village/service.py`; profile | U; formula tests; end-to-end display. |
| REQ-3.4 · §4.3 p13 | Update without reload · M3/M8 | `src/cp/store.ts`, Phaser projection; M8 event/outbox | U; store tests; live browser sync event check. |
| REQ-4.1 · §4.4 p14 | Comparable target matchmaking · M4 | CP targets; M4 matcher; profiles/attacks | U; `test_matchmaking.py`; load/eligibility measurement. |
| REQ-4.2 · §4.4 p14 | Target weak-topic problem set · M4 | attack detail; M4 curator/CF catalog | U; M4 tests; catalog coverage and real links. |
| REQ-4.3 · §4.4 p14 | Score attacker performance · M4 | result UI; proof-gated M4 settlement; attack/proof | P; solved fraction exists; timing/edge acceptance unresolved. |
| REQ-4.4 · §4.4 p14 | Admin cooldown · M4/M9 | cooldown UI; Postgres attack cooldown/config | C; launch timing follows SADD, SRS sequence says completion; preserve chosen launch rule. |
| REQ-4.5 · §4.4 p14 | Notify target and result · M4/M8 | notices; M8 outbox/WS/history | U; attack/realtime tests; receipt latency unmeasured. |
| REQ-5.1 · §4.5 p14 | Unique guild creation · M5 | CP guild; M5 transactional create/member; guilds | V for tested rollback/races; `test_guild_flow.py`; live multi-user UI pending. |
| REQ-5.2 · §4.5 p14 | Join/leader decision · M5 | CP Guild Hall/roster; M5 request/member locks; membership | U; explicit transfer, lock order and unique-leader migration 022 pass backend tests; mocked Guild Hall click/transfer UI passes desktop/mobile. Production migration precheck and live multi-user flow pending. |
| REQ-5.3 · §4.5 p14 | Member practice zone score · M5 | territory view; M5 affinity/decay; zone_contributions | C; current last-sync decay vs practice inactivity intent. |
| REQ-5.4 · §4.5 p14 | Owner by aggregate score · M5/M8 | zone list; locked M5 ownership + outbox | C; SADD 5% hysteresis vs SRS top-score; concurrency tests pass for covered cases. |
| REQ-5.5 · §4.5 p14 | Authenticated ownership map · M5 | CP SVG War Map, selected detail/list fallback; M5 polygon/territory API | U; mocked desktop/mobile keyboard/touch and refresh tests pass; live multi-user owner-change event delivery unverified. |
| REQ-6.1 · §4.6 p14 | Leader/officer member strengths · M6 | CP War Room; M6 role-gated service | U; `test_m6_war_room.py`; browser role check pending. |
| REQ-6.2 · §4.6 p14 | Zone-aligned members · M6 | CP contested UI; M6 alignment | U; M6 tests; UI highlight acceptance. |
| REQ-6.3 · §4.6 p14 | Recent member contribution · M6 | CP War Room; M6 current share | P; define recent window and align M5 decay. |
| REQ-7.1 · §4.7 p15 | Attack/defense/milestone trophies · M7 | CP league; trophy ledger/attack settlement | P; practice milestone award missing. |
| REQ-7.2 · §4.7 p15 | Six threshold tiers · M7 | CP tier; M7 Bronze→Legend config | U; `test_m7_league.py`; balance sign-off. |
| REQ-7.3 · §4.7 p15 | Auto promote/demote · M7/M8 | CP notice; M7 ledger/tier reconcile | U; M7 tests; concurrent cross-module acceptance. |
| REQ-7.4 · §4.7 p15 | Tier/count/next progress · M7 | CP league; M7 profile API | U; browser tier boundaries pending. |
| REQ-7.5 · §4.7 p15 | Global/guild leaderboards · M7 | CP toggle and guest public standings; M7 leaderboard | U; backend guest/member scoping and mock-backed desktop/mobile guest UI tests pass; live response/error flow and ranking under load unverified. |
| NFR-1.1 · §5.1 p15 | Dashboard/map ≤2 s | village/territory UI; API | U; exploratory local mocked-API cold canvas samples desktop p95 2003 ms/mobile p95 2181 ms (3 each), not comparable to SRS normal-network dashboard/map target. Backend/load/real network unmeasured. |
| NFR-1.2 · §5.1 p15 | Process ≤10 s after successful fetch | M2 worker/importer | U; no post-fetch→commit measurement. |
| NFR-1.3 · §5.1 p15 | Matchmaking ≤3 s under load | M4 API | U; no specified concurrency/load result. |
| NFR-1.4 · §5.1 p15 | Connected-client event ≤3 s | M8 WS/outbox | P; no trigger→browser measurement/ack. |
| NFR-2.1 · §5.2 p15 | No permanent loss on single component failure | Postgres solve/progression tables | P; backup/restore/failover unverified. |
| NFR-2.2 · §5.2 p15 | Validate judge input before progress | M2 CF adapter/importer | U; malformed tests exist; real data edge cases. |
| NFR-3.1 · §5.3 p15 | Verified ownership gate | M1 proof, M2 verified filter | U; real CF proof pending. |
| NFR-3.2 · §5.3 p15 | Salted hashes/no plaintext judge credentials | M1 bcrypt; CF public handle only | U; security/secret review pending. |
| NFR-3.3 · §5.3 p15 | War Room/admin RBAC | M6/M9 dependencies/services | P; role wording conflict and full route/IDOR sweep pending. |
| NFR-3.4 · §5.3 p15 | Limit attack/sync/guild actions | M4 cooldown, M2 rate, M5 services | P; guild/attack abuse limits unproven. |
| NFR-3.5 · §5.3 p15 | Audit admin actions | M9 audit tables/services | U; balance and suspension/unsuspension mutation+audit rollback/concurrency tests pass; production logging/retention unverified. |

## Additional SRS/SADD contracts and gaps

| Trace ID · source | Requirement / implementation | Status / acceptance |
|---|---|---|
| UC-1–UC-12 · SRS §2.5 | Auth, sync, village, attack/defense, guild, territory, War Room, league, admin journeys | P; isolated route tests are not multi-user end-to-end acceptance. |
| BR-ROLE/GUILD/ATTACK/TERR/ADMIN · SRS §5.5 | Leader/member/admin roles, one guild, uniform cooldown, top owner, admin moderation | P/C; role and territory timing/ownership conflicts recorded in decisions. |
| Q-AVAIL/SCALE/USAB/MAINT/EXT · SRS §5.4 | Judge outage degradation, Redis-supported scale, ≤5 steps/5 min onboarding, separable modules/adapters | P; five-step state-derived onboarding and Help/FAQ have mocked browser flows; timed ≤5-minute usability, load, and real outage evidence missing. |
| ENV/IF · SRS §§2.6–3.4 | Browser support, React+Phaser, FastAPI/Postgres/Redis, HTTPS/JSON/WSS and secure judge secrets | C/B; actual TS/Phaser 4 stack variance; production TLS/routing/restore absent. |
| DOC/OR · SRS §§2.8,6 | Onboarding, tooltips, guild handbook/FAQ, API compliance, retention/deletion | P/B; onboarding, in-app Guild Handbook, FAQ, Help navigation and workflow links browser-tested; contextual per-screen tips, judge-policy and deletion decisions open. English-only localization deferred. |
| SADD §§4–6/App B | M1–M9 modular monolith, worker, relational schema, representative REST/WS event contracts | P; core modules exist; M10 is extra; generated OpenAPI and operational contracts need acceptance. |
| SADD §§7.2–7.3 | PostgreSQL cooldown, matcher, affinity/decay/hysteresis, Elo-style trophies | P/C; explicit SRS conflicts and untested edge/load cases. |
| SADD §§8–11 | Accessible responsive UI, security, dev/stage/prod topology and migration rollout | P/B; mock-backed desktop/mobile auth, village, guild and map checks exist; staging, release operations, backup/restore and cross-browser verification pending. |

The SRS includes illustrative War Map, roster, standings and world-event figures; the SADD includes architecture/ER/lifecycle/wireframe/deployment diagrams. Figure content informs design intent but does not override explicit requirement wording. Revisit this matrix after each tested slice; do not upgrade status based solely on a route's existence.
