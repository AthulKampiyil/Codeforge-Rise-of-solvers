# Ashar — Auth & Platform

**Branch:** `feat/ashar-auth-admin` · **Base:** `ashar` · **Window:** ~2 weeks
**You own:** M1 Authentication, M9 Admin & Game-Balance Config, CI, Docker

Your lane is the one everyone else waits on twice: once for the config service
(Wave 1) and once because auth is the only way into any screen. Both of your
early items are small — land them fast, then the rest of your lane is yours alone.

> Full context: `docs/WORK_SPLIT_50.md`. Project reality check: `NEXT_STEPS.md`.

---

## 0. Before you start — you also own Wave 0

You have one job before anybody else can start: the **seed commit**, landed
straight onto `ashar`. Nobody forks until it's pushed. It's specified in
`docs/WORK_SPLIT_50.md` §3 — the short version is that `frontend/src/` is six
one-line comment files today, so if all four of you branch now, all four of you
create `index.html`, `App.jsx`, `routes/index.jsx` and `shared/ui/` and every one
of them becomes a four-way conflict. Create them once, yourself, first. Done when
`npm run build` exits 0.

Then branch for your own lane:

```bash
git fetch origin && git checkout ashar && git pull
git checkout -b feat/ashar-auth-admin
git push -u origin feat/ashar-auth-admin
```

---

## 1. Wave 1 — two contract PRs, first 48 hours

These are separate small PRs merged into `ashar` immediately, **not** held inside
your lane branch. Three other people are blocked on them.

### PR 1 — `GameBalanceConfig` read service

`backend/app/modules/m9_admin_config/service.py` is an empty file today. Build the
read path over the `game_balance_config` table:

```python
class GameBalanceConfig:
    def get(self, key: str) -> int | float | dict: ...
```

All 28 keys are **already seeded** by `alembic/versions/002_seed.py` — you are not
inventing values, just reading them. Cache in Redis (the clients are in
`app/core/redis.py`) and invalidate on write, so a config change takes effect
without a restart (that's the whole point of UC-12).

Who is waiting on which keys:

| Lane | Keys |
|---|---|
| Niranjan | `village.defense_base`, `village.defense_level_weight`, `village.defense_solved_weight` |
| Hari | `attack.cooldown_minutes`, `attack.window_hours`, `attack.problem_set_size`, `matchmaking.*`, `trophy.k_factor`, `trophy.elo_divisor`, `league.thresholds` |
| Athul | `territory.hysteresis_margin`, `territory.decay_per_day`, `territory.decay_floor` |

### PR 2 — `shared/api/client.js` hardening

The seed commit ships a working-but-basic fetch wrapper. Add: base URL from env,
`Authorization: Bearer` injection, and **401 → refresh → retry once → on second
401, log out and redirect**. Every authenticated call in every lane goes through
this, so it needs to be right before four people build on it.

---

## 2. Backend

### M9 Admin & Config — 5% → 60%

`m9_admin_config/router.py:13` currently returns
`{"message": "Admin configuration coming in Sprint 2"}`. Replace it:

- `GET /admin/config` — list all balance keys with current values and descriptions.
- `PUT /admin/config/{key}` — validate against the stored type (`int`/`float`/`dict`),
  write, bust the cache, and **insert an `admin_audit_log` row** (who, what, old →
  new, when). NFR-3.5 requires the audit trail.
- Role-gate both to admin using a dependency in `app/core/dependencies.py`.

Deliberately **not** in scope for 50%: user/guild moderation (UC-11), the DLQ
viewer, the audit-log browsing UI. Config editing alone is what unblocks others.

### M1 Auth — hardening

M1 is the one module that's genuinely complete, so this is verification, not
construction:

- Confirm the logout denylist actually invalidates a token — write the test that
  proves a logged-out access token gets a 401 before its natural expiry.
- Sweep remaining `datetime.utcnow()` calls (deprecated, and naive datetimes
  against timezone-aware DB columns bite later).
- Add the admin-role dependency the M9 routes above need.

---

## 3. Frontend

### `features/auth/` — Login & Register

Dark CODEVILLE theme; the tokens are already in `frontend/tailwind.config.js`
(`bg #0d1117`, `panel #141a22`, `border #2a323d`, gold accent `#c9a227`). Serif
headings, mono for numerals. These screens aren't in the wireframe, so match the
panel/border treatment from Fig 3.2 and keep them minimal.

**Error copy must not reveal account existence** — "Invalid credentials", never
"no user with that email". You'll be asked about this in review.

### `shared/auth/AuthContext.jsx`

Token storage, current user from `GET /auth/me`, and a `<RequireAuth>` wrapper.
The seed commit's `routes/index.jsx` already declares every route pointing at
placeholders — you wrap the guarded ones. **Don't restructure the router.**

### `/onboarding`

The judge-linking flow, all five endpoints already exist:
`POST /auth/judge-accounts` → user copies the returned token → sets it as their
Codeforces profile First Name → `POST /auth/judge-accounts/{id}/verify` → first
sync fires. SRS 5.4 wants ≤5 steps in under 5 minutes, so show a step counter and
don't add screens.

---

## 4. Infra

`.github/workflows/ci.yml` has two real problems:

1. The backend job runs `pytest || true`, so **it cannot fail**. Drop the `|| true`.
2. The existing tests need real Postgres and Redis (the schema uses Postgres-only
   types), and CI provides neither — so those tests are not actually passing
   anywhere. Add `postgres:16` and `redis:7` service containers, run
   `alembic upgrade head`, then `pytest`.

Also add the Docker daemon permission fix to `README.md` (`sudo usermod -aG docker $USER`
then re-login) — it currently blocks `docker compose up` on at least one machine.

---

## 5. Tests

- `backend/tests/test_m1_auth.py` — extend with the logout-denylist case.
- `backend/tests/test_m9_admin.py` — new: config read, config write + audit row,
  non-admin gets 403, cache busts on write.

---

## 6. Your files

**Edit freely:**

```
backend/app/modules/m1_auth/**
backend/app/modules/m9_admin_config/**
backend/tests/test_m1_auth.py
backend/tests/test_m9_admin.py
frontend/src/features/auth/**
frontend/src/shared/auth/**
frontend/src/shared/api/client.js
.github/workflows/ci.yml
docker-compose.yml
README.md
```

**Do not touch** (someone else owns them, or they're frozen after the seed commit):
`frontend/src/routes/index.jsx`, `frontend/src/App.jsx`, `frontend/src/shared/ui/**`,
`frontend/tailwind.config.js`, `frontend/package.json`, `backend/app/main.py`,
`backend/app/db/base.py`, any other lane's `m*/` folder.

**Migrations:** you write none. `game_balance_config` and `admin_audit_log` already
exist in `001_baseline`. If you think you need a migration, ask first — the
revision chain is pre-assigned and adding to it out of band breaks three people.

**New npm dependencies:** none without asking.

---

## 7. Dependencies

- **Nobody blocks you.** You can start the moment the seed commit lands.
- **You block everyone** via the two Wave 1 PRs. Ship those in 48 hours, then
  take your time on the rest.

---

## 8. Workflow & done

Weekly, without exception: `git fetch origin && git merge origin/ashar`
(merge, don't rebase — your branch is pushed and others may have pulled it).

**You merge first** of the four lanes; you have no migration, so you're the safe
opener.

**PR checklist:**

- [ ] `npm run build` exits 0
- [ ] `pytest backend/tests/test_m1_auth.py backend/tests/test_m9_admin.py` green
- [ ] CI backend job passes **without** `|| true`
- [ ] I edited no file outside §6
- [ ] I added no npm dependency
- [ ] Screenshot of Login + Register on the dark theme

**Lane is done when:** a new user can register, log in, link and verify a
Codeforces handle, stay logged in across a page reload, and an admin can change
`attack.cooldown_minutes` and see it take effect with no restart.
