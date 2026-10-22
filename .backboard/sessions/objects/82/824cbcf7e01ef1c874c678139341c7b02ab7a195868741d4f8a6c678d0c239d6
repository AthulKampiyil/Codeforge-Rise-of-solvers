# Security Notes

## Why there is no CSRF middleware

Sprint 1 shipped `app/middleware/csrf.py` as a pass-through stub with a
"TODO: implement in Sprint 2" comment. It has been removed rather than
implemented, because CSRF protection defends a specific attack: a
malicious page causing a victim's *browser* to submit an authenticated
request using credentials the browser attaches automatically (cookies).

CodeForge's frontend authenticates via a JWT sent in an
`Authorization: Bearer <token>` header (see `app/core/security.py`),
which the browser never attaches automatically to a cross-origin
request — a malicious page cannot forge that header without already
having read the token, at which point CSRF is not the relevant threat
model (token theft/XSS is). Standard REST APIs authenticated this way
do not need CSRF middleware; adding one back would be security theatre
that gives a false sense of coverage.

If a future revision introduces cookie-based session storage (e.g. to
support `httpOnly` refresh-token cookies for extra XSS resistance),
CSRF protection must be reintroduced at that point — reintroduce this
document's reasoning check whenever the auth transport changes.

## Session invalidation (REQ-1.6)

Sprint 1's `POST /auth/logout` was a no-op that always returned success
without invalidating anything — a token obtained before logout kept
working after it. As of Phase 2, every access token carries a `jti`
claim; logout adds that `jti` to a Redis denylist for the token's
remaining lifetime, and `get_current_user` rejects any token whose
`jti` is denylisted. Refresh tokens are rotated on use and carry
`type: "refresh"`, which `get_current_user` now explicitly rejects
(Sprint 1 accepted either token type as a bearer token, which let a
refresh token double as a permanent access token).

## Codeforces ownership verification (REQ-1.4, NFR-3.1)

Sprint 1's `verify_judge_profile()` always approved a link request
without checking anything. As of Phase 2, verification requires the
user to place a server-generated token in their Codeforces profile's
"First Name" field; verification calls the public
`GET /api/user.info?handles=<handle>` endpoint and checks the returned
`firstName` matches. No Codeforces credentials are ever transmitted to
or stored by CodeForge (NFR-3.2) — only the public handle.
