# ADR 0002: Refresh-token rotation

## Context

Long-lived access tokens are risky. A stolen refresh token should not remain valid forever, and reuse should be detectable.

## Decision

- Access tokens are short-lived JWTs.
- Refresh tokens are random opaque strings.
- Only a SHA-256 hash of the refresh token is stored.
- Refreshing revokes the current token atomically and issues a new one.
- Reuse of a revoked token returns `401` and forces a new login.
- The refresh token lives in an httpOnly cookie; the access token stays in memory/localStorage for the client retry path.

## Consequences

- A database leak does not expose usable refresh tokens.
- Refresh is a rotation, not an extension.
- Concurrent refresh from two tabs can invalidate one session; the client handles the 401 by returning to login.
- Tests cover successful rotation and reuse rejection.

## Alternatives considered

- Long-lived JWT only: rejected, no revocation.
- Refresh token stored in plaintext: rejected.
- Server-side session store: viable, but the current JWT + hashed refresh design keeps the API stateless for access checks.
