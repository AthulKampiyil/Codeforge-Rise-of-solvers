# Attack & League API Contract (P3)

**Last Updated**: September 1, 2026  
**Status**: Sprint 1 Complete, Stubs for Sprint 2

---

## Overview

This document defines the frozen API contract for M4 (Attacks) and M7 (League Trophy) modules. All endpoints listed below are production-ready with full SADD 4.x isolation compliance.

---

## M4 Attacks (REQ-4.x)

### Overview
Village attack mechanics with per-user cooldown prevention. Attacks are async records with success/failure resolution.

### Data Models

#### Attack
```json
{
  "id": "uuid",
  "attacker_user_id": "uuid",
  "defender_user_id": "uuid",
  "status": "pending|executing|success|failed",
  "score": 0,
  "challenge_topic": "algorithms|data-structures|mathematics|strings|optimization|greedy|dynamic-programming",
  "created_at": "2026-09-01T12:00:00Z",
  "resolved_at": null
}
```

#### AttackCooldown
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "last_attack_at": "2026-09-01T11:30:00Z",
  "cooldown_minutes": 30,
  "created_at": "2026-09-01T11:30:00Z",
  "updated_at": "2026-09-01T11:30:00Z"
}
```

#### AttackStatus Enum
```
pending    - Attack created, awaiting resolution
executing  - Defense phase in progress (TODO Sprint 2)
success    - Attacker won, scored points
failed     - Attacker lost or timed out
```

### Endpoints

#### 1. GET /attacks/targets
**Purpose**: Find viable attack targets (STUB for Sprint 2)

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `limit` (int, optional, default=10): Max targets to return

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "defender1",
    "level": 3,
    "total_solved": 16,
    "defense_rating": 0.0
  }
]
```

**Stub Behavior** (Sprint 1):
- Returns empty list `[]`
- Real implementation (Sprint 2): Strength-based matchmaking algorithm

**Error Responses**:
- `401 Unauthorized`: Invalid or expired token
- `500 Internal Server Error`: Database error

**Integration Notes**:
- Will consume M3 village data (user's level from sqrt(solved_count))
- Will integrate with M7 defense_rating for matchmaking

---

#### 2. POST /attacks
**Purpose**: Launch a village attack on another user

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "defender_user_id": "550e8400-e29b-41d4-a716-446655440001",
  "challenge_topic": "algorithms"
}
```

**Response** (201 Created):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "attacker_user_id": "550e8400-e29b-41d4-a716-446655440000",
  "defender_user_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "pending",
  "score": 0,
  "challenge_topic": "algorithms",
  "created_at": "2026-09-01T12:00:00Z",
  "resolved_at": null
}
```

**Error Responses**:
- `400 Bad Request`: Invalid topic or user ID
- `401 Unauthorized`: Invalid token
- `429 Too Many Requests`: Cooldown active (see response below)

**429 Cooldown Response**:
```json
{
  "detail": "Attack on cooldown. Next available attack: 2026-09-01T12:30:00Z",
  "next_available_at": "2026-09-01T12:30:00Z",
  "cooldown_remaining_minutes": 15
}
```

**Business Logic**:
1. Verify `can_attack()` for attacker (cooldown check)
2. If cooldown active → return 429
3. Create Attack record with status=pending
4. Update AttackCooldown.last_attack_at to current time
5. Return new Attack record

**Cooldown Calculation**:
```
elapsed = now - last_attack_at
remaining = cooldown_minutes - (elapsed in minutes)
can_attack = remaining <= 0
```

---

#### 3. GET /attacks/cooldown
**Purpose**: Check current cooldown status for authenticated user

**Authentication**: Required (Bearer token)

**Response** (200 OK, can attack):
```json
{
  "can_attack": true,
  "cooldown_minutes": 30,
  "next_available_at": null
}
```

**Response** (200 OK, cooldown active):
```json
{
  "can_attack": false,
  "cooldown_minutes": 30,
  "next_available_at": "2026-09-01T12:30:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or expired token

**Business Logic**:
1. Look up AttackCooldown for user
2. If no record exists → can_attack=true, next_available_at=null
3. If record exists → calculate elapsed time
4. If elapsed >= cooldown_minutes → can_attack=true
5. Else → can_attack=false, next_available_at = last_attack_at + cooldown_minutes

---

## M7 League & Trophy (REQ-7.x)

### Overview
Competitive leaderboard system with 6 league tiers (bronze → legend). Points awarded for attack victories; tiers auto-calculated.

### Data Models

#### Trophy
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "tier": "bronze|silver|gold|platinum|diamond|legend",
  "points": 0,
  "trophy_count": 0,
  "created_at": "2026-09-01T12:00:00Z",
  "updated_at": "2026-09-01T12:00:00Z"
}
```

#### LeagueTier Enum
```
bronze     - 0-99 points
silver     - 100-299 points
gold       - 300-699 points
platinum   - 700-1499 points
diamond    - 1500-2999 points
legend     - 3000+ points
```

#### Trophy Thresholds (Tunable)
```python
TROPHY_THRESHOLDS = {
    LeagueTier.bronze:     {"min_points": 0, "max_points": 99},
    LeagueTier.silver:     {"min_points": 100, "max_points": 299},
    LeagueTier.gold:       {"min_points": 300, "max_points": 699},
    LeagueTier.platinum:   {"min_points": 700, "max_points": 1499},
    LeagueTier.diamond:    {"min_points": 1500, "max_points": 2999},
    LeagueTier.legend:     {"min_points": 3000, "max_points": 999999},
}
```

**Note**: Thresholds are defined in `app/modules/m7_league_trophy/models.py` for easy game-balance tuning by admins (M9).

### Endpoints

#### 1. GET /league/me
**Purpose**: Retrieve authenticated user's current trophy/league status

**Authentication**: Required (Bearer token)

**Response** (200 OK):
```json
{
  "tier": "gold",
  "points": 450,
  "trophy_count": 12,
  "updated_at": "2026-09-01T11:45:00Z"
}
```

**Business Logic**:
1. Look up Trophy record for user
2. If no record → create with bronze tier, 0 points
3. Return tier, points, trophy_count, updated_at (ISO format)

**Error Responses**:
- `401 Unauthorized`: Invalid or expired token
- `500 Internal Server Error`: Database error

---

## Integration Points

### M4 → M7
When an attack resolves as `success`, the attacker earns points (TODO Sprint 2):
```python
# Stub in Sprint 1
def resolve_attack(attack_id, success, score):
    # In Sprint 2: if success:
    #   league_service.add_points(attacker_id, score)
    pass
```

### M4 → M3 (Village)
Attack targets are ranked by village level (computed from M3 data):
```python
# Village level = floor(sqrt(solved_count))
# Use in matchmaking algorithm for target selection
```

### M7 → M3 (Village)
Defense rating influences attack odds (TODO Sprint 2):
```python
# defense_rating = f(trophy_tier, trophy_count)
# Higher tier + count = harder to attack successfully
```

---

## Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | GET successful |
| 201 | Created | POST successful, resource created |
| 400 | Bad Request | Invalid input (malformed JSON, invalid UUID, unknown topic) |
| 401 | Unauthorized | Missing/invalid/expired token |
| 429 | Too Many Requests | Attack cooldown active |
| 500 | Server Error | Database connection, internal logic error |

---

## Authentication

All endpoints require HTTP Bearer authentication:
```
Authorization: Bearer <access_token>
```

Token Format: JWT with HS256 signature, 7-day expiry
- Token obtained via POST /auth/login
- Verified by app/core/dependencies.py:get_current_user()

---

## Rate Limiting

- **Attack Cooldown**: Per-user, 30 minutes by default (tunable in TROPHY_THRESHOLDS)
- **GET Endpoints**: No explicit rate limit (rely on reverse proxy)

---

## Pagination (Future)

Not implemented in Sprint 1. Stub endpoints return fixed-size lists.

In Sprint 2, consider:
- `GET /attacks/targets?limit=20&offset=0` for pagination
- `GET /league/leaderboard?limit=50&offset=0` for top players

---

## Timestamps

All timestamps are in ISO 8601 format (UTC):
```
2026-09-01T12:00:00Z
```

---

## Error Response Format

All error responses follow this format:
```json
{
  "detail": "Human-readable error message"
}
```

For 429 (cooldown), additional fields:
```json
{
  "detail": "Attack on cooldown. Next available attack: 2026-09-01T12:30:00Z",
  "next_available_at": "2026-09-01T12:30:00Z",
  "cooldown_remaining_minutes": 15
}
```

---

## Deployment Notes

### Environment Variables
```
ATTACK_COOLDOWN_MINUTES=30  # Default cooldown (tunable)
```

### Database Indices
For performance at scale:
```sql
CREATE INDEX idx_attacks_attacker ON attacks(attacker_user_id);
CREATE INDEX idx_attacks_defender ON attacks(defender_user_id);
CREATE INDEX idx_attack_cooldowns_user ON attack_cooldowns(user_id);
CREATE INDEX idx_trophies_user ON trophies(user_id);
CREATE INDEX idx_trophies_tier ON trophies(tier);
```

### Migration
Run after database is online:
```bash
alembic upgrade head  # Includes 003_add_m4_m7_tables.py
```

---

## Testing

### Manual API Tests
```bash
# 1. Register user and login to get token
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"attacker","email":"a@test.com","password":"Test123!"}'

# 2. Get cooldown status
curl -X GET http://localhost:8000/attacks/cooldown \
  -H "Authorization: Bearer <token>"

# 3. Attack another user (requires 2nd user)
curl -X POST http://localhost:8000/attacks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"defender_user_id":"<uuid>","challenge_topic":"algorithms"}'

# 4. Check league status
curl -X GET http://localhost:8000/league/me \
  -H "Authorization: Bearer <token>"
```

### Automated Tests
```bash
pytest backend/tests/test_m4_m7.py -v
```

All tests use in-memory SQLite (no PostgreSQL required).

---

## Future Enhancements (Sprint 2+)

- [ ] Real matchmaking algorithm (strength-based target selection)
- [ ] Defense phase logic (challenge resolution, scoring)
- [ ] Leaderboard endpoint (GET /league/leaderboard with ranking)
- [ ] Trophy progression history (audit log of tier changes)
- [ ] Guild warfare integration (M5 guild vs guild attacks)
- [ ] WebSocket notifications on attack received (M8)
- [ ] Admin cooldown adjustment endpoint (M9)

---

**Last Reviewed**: September 1, 2026  
**Next Review**: Sprint 2 (October 1, 2026)
