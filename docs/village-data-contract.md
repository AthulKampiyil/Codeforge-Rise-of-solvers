# Platform Sync & Village API Contract (M2 & M3)

**Status**: Frozen for Sprint 1 integration (Aug 20, 2026)  
**Requirements**: REQ-2.1 through REQ-3.4 (SRS §4.2–4.3)  
**Responsible**: P2 (Platform Sync + Village)

---

## Overview

This document defines the HTTP endpoints and data models for:
- **M2**: Coding platform syncing (Codeforces, LeetCode, CodeChef)
- **M3**: Personal code village progression system

---

## Endpoints

### 1. GET /platform_sync/status

**Purpose**: Get sync status for all user's linked judges (REQ-2.4)

**Request**:
```
Authorization: Bearer <access_token>
GET /platform_sync/status
```

**Response** (200 OK):
```json
[
  {
    "judge_name": "codeforces",
    "status": "up_to_date | in_progress | failed",
    "last_synced_at": "ISO 8601 datetime or null",
    "last_error": "string or null"
  },
  {
    "judge_name": "leetcode",
    "status": "up_to_date",
    "last_synced_at": "2026-09-01T10:00:00.000000",
    "last_error": null
  }
]
```

**Error Cases**:
- **401**: Invalid or expired token

**Notes**:
- Empty array if user has no linked judges
- Returned for all linked profiles (verified and unverified)
- Status values: `up_to_date` (last sync succeeded), `in_progress` (currently syncing), `failed` (last sync failed)

---

### 2. GET /village/me

**Purpose**: Get user's village profile with topic progression (REQ-3.4)

**Request**:
```
Authorization: Bearer <access_token>
GET /village/me
```

**Response** (200 OK):
```json
{
  "user_id": "UUID",
  "total_solved": 47,
  "average_level": 3.5,
  "topics": [
    {
      "id": "UUID",
      "name": "algorithms",
      "solved_count": 25,
      "level": 5
    },
    {
      "id": "UUID",
      "name": "data-structures",
      "solved_count": 12,
      "level": 3
    },
    {
      "id": "UUID",
      "name": "dynamic-programming",
      "solved_count": 10,
      "level": 3
    }
  ],
  "defense_rating": 0.0
}
```

**Error Cases**:
- **401**: Invalid or expired token

**Notes**:
- `total_solved`: Sum of all topics' solved_count
- `average_level`: Average of all topics' levels (rounded to 2 decimals)
- `level` per topic: floor(sqrt(solved_count)) — computed from problem-solving progression
- `defense_rating`: Placeholder for Sprint 2 (currently 0.0)
- Topics are sorted by level (descending)

---

## Data Models

### Topic (M3)

Represents a skill category in the village system (REQ-3.x).

```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description VARCHAR(500),
  created_at TIMESTAMP NOT NULL
);
```

**Fixed Topic List** (REQ-2.3, REQ-3.x):
- `algorithms`
- `data-structures`
- `mathematics`
- `strings`
- `optimization`
- `greedy`
- `dynamic-programming`

### VillageTopicProgress (M3)

Tracks user's progression in each topic (REQ-3.1–3.4).

```sql
CREATE TABLE village_topic_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  topic_id UUID NOT NULL REFERENCES topics(id),
  solved_count INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(user_id, topic_id)
);
```

### SyncLog (M2)

Tracks sync status for user's judge profiles (REQ-2.4).

```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  judge_name VARCHAR(50) NOT NULL,
  last_synced_at TIMESTAMP,
  status ENUM('up_to_date', 'in_progress', 'failed') NOT NULL,
  last_error VARCHAR(500),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

---

## Sync Flow (M2)

### Judge Adapters

Each judge platform (Codeforces, LeetCode, CodeChef) has an isolated adapter (SADD 4.3, TBD-1):
- `CodeforcesAdapter`: Calls Codeforces public API (`/api/user.status`) to fetch accepted submissions
- `LeetCodeAdapter`: TODO (Sprint 2)
- `CodeChefAdapter`: TODO (Sprint 2)

**Adapter Interface**:
```python
async def get_submissions(handle: str) -> dict:
    """
    Returns:
    {
        "status": "OK" or "FAILED",
        "result": [
            {
                "id": submission_id,
                "problem": {
                    "contestId": int,
                    "index": str,
                    "name": str,
                    "tags": ["array", "dp", ...]
                },
                "creationTimeSeconds": unix_timestamp,
                "verdict": "OK"
            },
            ...
        ]
    }
    """
```

### Topic Tagger (M2)

Maps Codeforces problem tags to the fixed topic list (REQ-2.3, SADD 4.3):

**Tag Mapping** (examples):
- `dp`, `dynamic-programming` → `dynamic-programming`
- `data-structures`, `array`, `tree` → `data-structures`
- `math`, `number-theory` → `mathematics`
- `greedy` → `greedy`
- `bfs`, `dfs`, `graphs` → `algorithms`

**Unknown tags**: Skipped (not mapped to any topic)

### Sync Scheduler (M2)

Orchestrates syncing submissions and updating village progress (REQ-2.1, REQ-2.2):

1. For each user's linked + verified judge profile:
2. Call judge adapter to fetch accepted submissions
3. For each submission, extract tags → map to topics → increment VillageTopicProgress
4. Update level: level = floor(sqrt(solved_count))
5. Log sync status (up_to_date, failed)

**Sync Frequency**:
- Manual sync: On-demand via future endpoint (Sprint 2)
- Recurring sync: Background worker job every 6 hours (Sprint 2)

---

## Integration Notes

### M1 ↔ M2 Coupling

When a user links a judge (M1 endpoint `POST /auth/judges/link`):
1. `LinkedJudgeProfile` is created with `verified=false`
2. User must verify by posting token on judge platform
3. TODO (Sprint 2): M2 adapter confirms token exists on judge platform
4. On first verification success, M2 can begin syncing

### M2 ↔ M3 Coupling

When M2 syncs a user's submissions:
1. Extract problem tags from Codeforces
2. Map tags to topics via TopicTagger
3. For each topic, create or update `VillageTopicProgress`
4. Increment solved_count, recompute level
5. User can then view profile via M3 endpoint `GET /village/me`

---

## Testing

Run tests:
```bash
pytest backend/tests/test_m2_m3.py -v
```

Expected coverage:
- TopicTagger: Tag → topic mapping, case-insensitivity, unknown tags
- VillageRepository: CRUD for progress records
- VillageService: Level calculation, village profile aggregation
- SyncLog: Creation and status tracking

---

## Deployment Notes

- **Codeforces API**: Public, no authentication required. Base URL: `https://codeforces.com/api`
- **LeetCode API**: TODO (requires auth, rate limiting)
- **CodeChef API**: TODO (requires API key)
- **Sync Scheduler**: Runs in background worker (`backend/worker/main.py`) — TODO (Sprint 2)

---

## Future Work (Sprint 2)

- [ ] Implement judge verification (call adapter to confirm token posted)
- [ ] Implement LeetCode and CodeChef adapters
- [ ] Implement recurring sync job in worker
- [ ] Implement defense_rating calculation (based on level, topic rarity, etc.)
- [ ] Implement topic leaderboard endpoint
- [ ] Add sync status badge to frontend village page
