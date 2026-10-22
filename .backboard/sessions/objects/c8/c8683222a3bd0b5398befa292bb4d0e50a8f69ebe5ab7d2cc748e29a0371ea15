# CodeForge User Manual — §Attacks & League Progression

**Module Owner:** Hari (M4 Async Village Attacks, M7 League & Trophy Progression)  
**Target Audience:** Solvers, Guild Officers, Tournament Admins  
**Reference:** SADD §7.2, §7.3.1.1, §7.3.1.3, SRS REQ-4.x, REQ-7.x

---

## 1. Village Attacks (REQ-4.x)

Village Attacks are asynchronous competitive encounters where a solver challenges another player's village by solving a curated set of algorithmic challenges within a timed window.

### 1.1 Matchmaking & Target Discovery (REQ-4.1)
- **Defense Rating Range:** The system uses an indexed scan on player defense ratings to recommend balanced targets.
- **Dynamic Tolerance Bands (SADD §7.3.1.1):** Base tolerance is ±12%, adjusted by the attacker's league tier:
  - *Bronze:* +8% (wider search pool)
  - *Silver:* +5%
  - *Gold:* +2%
  - *Platinum:* 0%
  - *Diamond:* -2%
  - *Legend:* -8% (narrow search pool against top competitors)
- **Automatic Band Widening:** If fewer than 3 candidates are found, the tolerance band widens iteratively by 5% up to a maximum cap of 30%.
- **Target Exclusions:**
  - Self is always excluded.
  - Targets attacked by the user within the last 24 hours (`matchmaking.recent_attack_window_h`) are excluded.
  - Targets attacked by anyone in the last 15 minutes (`attack.defense_grace_minutes`) are protected by defense grace.
  - Suspended and deactivated accounts are excluded.

### 1.2 Target Weakness Problem Curation (REQ-4.2)
- Upon attack launch, the system analyzes the defender's village structure and identifies their weakest topic areas (e.g. Dynamic Programming, Graph Theory).
- Curates a set of 3 Codeforces problems calibrated to probe those specific vulnerabilities.
- Each problem provides direct deep-links to Codeforces for solving.

### 1.3 Cooldown Enforcement (REQ-4.4, SADD §7.2.1)
- Launching an attack triggers an immediate durable cooldown (default 60 minutes) stored in `users.attack_cooldown_expires_at`.
- Re-attacking during an active cooldown yields HTTP `429 Too Many Requests` with the exact `next_available_at` timestamp.

### 1.4 Attack Resolution Lifecycle (REQ-4.3)
Attacks have an active window of 24 hours (`attack.window_hours`). An attack can be resolved via three paths:
1. **On-Demand Resolution:** When the solver completes problems on Codeforces and submits on the Attack Detail page.
2. **Auto-Resolution on Expiry:** When the attack detail is viewed or the background worker processes due attacks after the 24-hour window expires.
3. **Abandonment:** Attacker explicitly abandons the attack, incurring a flat penalty of 5 trophies with 0 defender movement.

---

## 2. League & Trophy Progression (REQ-7.x)

CodeForge features an auditable Elo-based league progression system with six competitive divisions.

### 2.1 League Tiers & Thresholds (REQ-7.2, REQ-7.3)

| Tier | Minimum Trophies | Elo K-Factor | Division Perk / Notes |
|---|---|---|---|
| **Bronze** | 0 🏆 | K = 32 | Starter tier (Default: 300 🏆) |
| **Silver** | 400 🏆 | K = 32 | Unlocks advanced matchmaking |
| **Gold** | 800 🏆 | K = 32 | Eligible for guild zone contributions |
| **Platinum** | 1,300 🏆 | K = 24 | High-stakes ranked bracket |
| **Diamond** | 1,900 🏆 | K = 24 | Master competitive division |
| **Legend** | 2,600 🏆 | K = 16 | Top grandmaster leaderboard |

### 2.2 Elo Trophy Delta Formula (SADD §7.3.1.3)
When an attack concludes with solved fraction $f \in [0.0, 1.0]$:
1. **Expected Score:**
   $$E_{\text{att}} = \frac{1}{1 + 10^{(R_{\text{def}} - R_{\text{att}}) / 400}}, \quad E_{\text{def}} = 1 - E_{\text{att}}$$
2. **Outcome Cases:**
   - **Case 1 (Attacker Victory, $f \ge 0.34$):**
     $$\Delta_{\text{att}} = \text{round}(K \cdot (f - E_{\text{att}})), \quad \Delta_{\text{def}} = \text{round}(K \cdot ((1 - f) - E_{\text{def}}))$$
   - **Case 2 (Successful Defense, $f < 0.34$):**
     Treated as $f = 0.0$. Attacker suffers defeat delta; defender earns full defense trophies.
   - **Case 3 (Abandonment):**
     Attacker loses a flat 5 trophies; defender delta is 0.

### 2.3 Append-Only Trophy Ledger Auditability (SADD §7.2, Appendix D)
- All trophy adjustments occur **strictly** through `TrophyLedger`. Direct profile mutations are forbidden.
- Every event records `event_type` (`attack_win`, `attack_loss`, `successful_defense`, `failed_defense`, `attack_abandoned`), `delta`, `resulting_balance`, `source_ref_id`, and a UTC timestamp.
- Solvers can inspect their complete audit history via the **Trophy Ledger** modal on the League page.

### 2.4 Leaderboard & Scopes (REQ-7.5)
- **Global Leaderboard:** Ranks all active solvers by trophy count descending.
- **Guild Leaderboard:** Scoped to fellow guild members for internal rankings and squad dominance tracking.

---

## 3. Background Worker Jobs (SADD 11.2)

The background worker executes scheduled maintenance tasks:
1. **`resolve_due_attacks` (M4):** Scans for in-progress attacks with `window_expires_at <= now` and calculates final scores and ledger updates.
2. **`reconcile_league_tiers` (M7):** Scans for profiles where `league_tier` has drifted from `trophy_count` and synchronizes them with current balance configuration thresholds.

---

## 4. Realtime Battle Notifications (M8 Integration)
- **`ATTACK_INCOMING`:** Notifies the defender in realtime when an attack is initiated against their village.
- **`ATTACK_RESOLVED`:** Dispatches outcome payloads with trophy deltas to both participants.
- **`LEAGUE_TIER_CHANGED`:** Emits division promotion and demotion alerts across the client interface.
