# Authentication API Contract (M1)

**Status**: Frozen for Sprint 1 integration (Aug 20, 2026)  
**Requirements**: REQ-1.1 through REQ-1.6 (SRS §4.1)  
**Responsible**: P1 (Foundation)

---

## Overview

This document defines the exact HTTP request/response shapes for all M1 endpoints.
Other modules (M2–M9) **must not change or extend these signatures** without explicit team notification.

---

## Endpoints

### 1. POST /auth/register

**Purpose**: Register a new user account (REQ-1.1)

**Request**:
```json
{
  "username": "string (3-50 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)"
}
```

**Response** (201 Created):
```json
{
  "id": "UUID",
  "username": "string",
  "email": "string",
  "is_active": "boolean",
  "is_admin": "boolean",
  "created_at": "ISO 8601 datetime"
}
```

**Error Cases**:
- **400**: Email already registered
- **400**: Username already taken
- **422**: Invalid field format (password too short, invalid email, etc.)

**Notes**:
- Password is bcrypt-hashed on server (NFR-3.2), never stored plaintext
- Both email and username are case-insensitive unique constraints
- User is active by default, is_admin defaults to false

---

### 2. POST /auth/login

**Purpose**: Authenticate user and issue tokens (REQ-1.2, REQ-1.6)

**Request**:
```json
{
  "email": "string (valid email)",
  "password": "string"
}
```

**Response** (200 OK):
```json
{
  "access_token": "JWT string",
  "refresh_token": "JWT string",
  "token_type": "bearer",
  "user": {
    "id": "UUID",
    "username": "string",
    "email": "string",
    "is_active": "boolean",
    "is_admin": "boolean",
    "created_at": "ISO 8601 datetime"
  }
}
```

**Error Cases**:
- **401**: "Incorrect email or password" (intentionally generic, prevents user enumeration)

**Notes**:
- Access token valid for 7 days of idle time (REQ-1.6)
- Refresh token valid for 30 days
- Tokens are JWT with RS256 or HS256 signature (see core/config.py)
- **Critical**: Return generic error message for both bad email and bad password to prevent user enumeration

---

### 3. POST /auth/logout

**Purpose**: Invalidate current session (REQ-1.6)

**Request**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Error Cases**:
- **401**: Invalid or expired token

**Notes**:
- TODO (Sprint 2): Implement Redis token blacklist to prevent reuse of invalidated tokens
- For Sprint 1, endpoint is stubbed and always succeeds if token is valid

---

### 4. POST /auth/judges/link

**Purpose**: Request judge profile linking (REQ-1.3, REQ-1.4)

**Request**:
```
Authorization: Bearer <access_token>
```

```json
{
  "judge_name": "codeforces | leetcode | codechef",
  "handle": "string (1-255 chars)"
}
```

**Response** (200 OK):
```json
{
  "verification_token": "string (urlsafe token)",
  "message": "Link request created. Submit this token as a comment on a solved problem to verify.",
  "linked_profile": {
    "id": "UUID",
    "judge_name": "string",
    "handle": "string",
    "verified": false,
    "created_at": "ISO 8601 datetime"
  }
}
```

**Error Cases**:
- **400**: Already linked to this judge (if verified=true)
- **401**: Invalid or expired token
- **400**: Invalid judge_name

**Notes**:
- Generates a one-time `verification_token` (32 chars, urlsafe base64)
- User must post this token as proof on the judge platform (e.g., Codeforces comment)
- TODO (Sprint 2): Wire `verification_token` check to M2 judge adapters to confirm token actually posted
- For Sprint 1, verification is stubbed (always succeeds)
- A user can link the same judge only once (unlink first to change handle)
- Different users can have the same judge handle

---

### 5. DELETE /auth/judges/{judge_name}

**Purpose**: Unlink a judge profile (REQ-1.5)

**Request**:
```
Authorization: Bearer <access_token>
DELETE /auth/judges/codeforces
```

**Response** (200 OK):
```json
{
  "message": "Unlinked from codeforces"
}
```

**Error Cases**:
- **401**: Invalid or expired token
- **404**: No linked profile for this judge
- **400**: Invalid judge_name

**Notes**:
- Only the user who linked the judge can unlink it
- Deletion is permanent; user can re-link the same judge with new handle

---

### 6. GET /auth/judges/me

**Purpose**: Get all linked judge profiles for current user

**Request**:
```
Authorization: Bearer <access_token>
GET /auth/judges/me
```

**Response** (200 OK):
```json
[
  {
    "id": "UUID",
    "judge_name": "codeforces",
    "handle": "myhandle",
    "verified": true,
    "created_at": "ISO 8601 datetime"
  },
  {
    "id": "UUID",
    "judge_name": "leetcode",
    "handle": "anotherhandle",
    "verified": false,
    "created_at": "ISO 8601 datetime"
  }
]
```

**Error Cases**:
- **401**: Invalid or expired token

**Notes**:
- Empty array if user has no linked judges
- Returns both verified and unverified profiles

---

## Token Format

Both `access_token` and `refresh_token` are JWT strings with the following payload:

```json
{
  "sub": "user_id (UUID as string)",
  "exp": "expiration timestamp (Unix seconds)",
  "type": "access or refresh" // refresh_token has this field
}
```

**Signature**: HS256 with SECRET_KEY from core/config.py

---

## Security Notes (NFR-3.2)

1. **Passwords**: Bcrypt-hashed with salt cost 12 (passlib default)
2. **Tokens**: Signed JWT; never store tokens in database (stateless)
3. **User Enumeration**: Login/verify always returns generic error message
4. **Email Validation**: Pydantic EmailStr enforces RFC 5322 format
5. **HTTPS**: All endpoints must be served over HTTPS in production (use CORS + HttpOnly cookies if deployed)

---

## Dependencies for Other Modules

### M2–M9 Usage of `get_current_user`

All protected endpoints use this shared dependency:

```python
from app.core.dependencies import get_current_user
from typing import Annotated

@router.get("/some-protected-endpoint")
def my_endpoint(current_user: Annotated[User, Depends(get_current_user)]):
    # current_user is a User ORM object with id, username, email, etc.
    pass
```

The dependency:
- Extracts JWT from `Authorization: Bearer <token>` header
- Validates signature and expiration
- Returns the User object or raises 401
- **Do not modify the signature of `get_current_user` without team sync**

---

## Integration Checklist

- [x] Registration endpoint with unique email/username
- [x] Login endpoint with JWT issuance
- [x] Logout stub (Redis blacklist TODO Sprint 2)
- [x] Judge linking with verification token
- [x] Judge unlinking
- [x] Get user's linked judges
- [x] Token validation in dependencies
- [x] Bcrypt password hashing
- [x] No user enumeration in error messages
- [x] Alembic migration (001_initial_schema.py)
- [x] Pytest test coverage (9+ test cases)

---

## Testing

Run auth tests:
```bash
pytest backend/tests/test_m1_auth.py -v
```

Expected: All tests pass, including:
- Register happy path & error cases
- Login with correct/incorrect credentials
- Judge linking & unlinking
- Token validation

---

## Deployment Notes

- Set `SECRET_KEY` environment variable (never use dev default in production)
- Set `POSTGRES_*` environment variables to point at production database
- JWT tokens are stateless; no token table needed in DB
- Token blacklist (logout) requires Redis (`TODO` Sprint 2)
