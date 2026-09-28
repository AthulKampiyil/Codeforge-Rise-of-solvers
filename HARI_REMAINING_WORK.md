# Hari Krishnan S — Remaining Work Checklist

## Scope
This file covers the remaining work for Hari’s assigned lane only:
- M4 Attacks
- M7 League & Trophy system
- attack and league frontend flow
- validation, worker integration, and final cleanup

---

## 1. Current status

### Already implemented
- Attack UI page exists and is wired to hook-based API usage: [frontend/src/features/attacks/pages/AttackPage.jsx](frontend/src/features/attacks/pages/AttackPage.jsx)
- League UI page exists and is wired to real leaderboard/profile data: [frontend/src/features/league/pages/LeagueStandingsPage.jsx](frontend/src/features/league/pages/LeagueStandingsPage.jsx)
- Attack and league backend tests already exist: [backend/tests/test_attack_flow.py](backend/tests/test_attack_flow.py), [backend/tests/test_m7_league.py](backend/tests/test_m7_league.py)
- Core attack and trophy logic exists in backend modules for M4 and M7

### Verified and completed
- The backend environment issue was resolved by using the compose network database URL (`postgres` host + `codeforge_test` DB), not a stale local Postgres instance.
- Worker due-query logic was validated by the dedicated attack and league test coverage.
- Frontend build verification confirms the attack and league pages compile cleanly with live hooks/data wiring.

---

## 2. Immediate work to complete

### 2.1 Fix the test environment first
- [x] Set up the backend Python environment correctly so `pytest` can import the `app` package
- [x] Run the attack-related tests from the backend root
- [x] Run the league/trophy-related tests from the backend root
- [x] Resolve any dependency or import issues preventing test execution

### 2.2 Validate the attack flow
- [x] Launch an attack successfully and confirm the attack record is created
- [x] Confirm a curated problem set is generated for the attack
- [x] Confirm cooldown logic triggers on repeated attacks and returns the required 429 response
- [x] Resolve an attack and verify the trophy delta is applied correctly
- [x] Check that the frontend reflects the updated attack state correctly

### 2.3 Validate the league and trophy flow
- [x] Verify leaderboard data loads correctly from backend APIs
- [x] Verify trophy ledger entries are created correctly and match the balance logic
- [x] Verify tier changes happen correctly when the threshold is crossed
- [x] Confirm the frontend displays the correct tier/progress/leaderboard values
- [x] Validate that attack wins/losses and defense outcomes update trophy balances consistently

### 2.4 Verify worker due-query logic
- [x] Check M4 due-attacks query logic used by the background worker
- [x] Check M7 reconciliation / due-update logic used by the worker
- [x] Confirm worker-triggered actions do not corrupt trophy ledger integrity
- [x] Verify expired or due attacks get resolved correctly without manual intervention

### 2.5 Final UI/real-data checks
- [x] Confirm attack components use live data and not leftover placeholder values
- [x] Confirm league components use live leaderboard/profile data
- [x] Check for any remaining hardcoded strings or mock state in attack/league pages
- [x] Fix naming/import issues if any component is still disconnected or stale

---

## 3. Cleanup tasks

- [x] Remove or remove warnings for stale/unused attack or league components
- [x] Check if superseded files like old standings variants are still present and should be deleted
- [x] Ensure all imports and references match the final structure
- [x] Remove dead/mock logic related to the attacks or league lane if still present

---

## 4. Final validation before completion

- [x] Attack tests pass in a working backend environment
- [x] League/trophy tests pass in a working backend environment
- [x] Frontend attack page renders correctly with real data
- [x] Frontend league page renders correctly with real data
- [x] Worker-triggered due actions are verified for both M4 and M7
- [x] Final project status reflects the actual state without stale claims

---

## 5. Current blocker

Resolved: the backend issue was environment configuration rather than app code.
The real project setup uses the Docker Postgres service (`postgres` host on the compose network), and the correct test database URL is `postgresql://codeforge:codeforge@postgres:5432/codeforge_test`.

---

## 6. Priority order

1. [x] Fix backend environment and import path issues
2. [x] Run attack tests and fix failing issues
3. [x] Run league/trophy tests and fix failing issues
4. [x] Verify worker due-query behavior
5. [x] Validate frontend real-data flow
6. [x] Cleanup stale files and finalize handoff

---

## 7. Final note
This checklist is intentionally limited to Hari Krishnan S’s assigned work only. It excludes Ashar, Athul, and Niranjan responsibilities.
