# TPR-07 — Parent identity integration contract

**Status:** OIDC start, callback, session and logout handlers are implemented with a browser-bound one-time PostgreSQL transaction store and short-lived revocable sessions. They remain disabled without operator-supplied provider, database and signing configuration; live integration is unverified.

## Trust boundaries

- Justice For All is the intended OIDC identity authority; its issuer, client ID and same-origin JWKS URL must be configured explicitly by an operator.
- Start authorization using the authorization-code grant with PKCE S256 and independently random `state`, `nonce`, and code verifier. Persist login transactions in short-lived trusted storage; the helper does **not** create a browser cookie itself.
- After the trusted backend exchanges the code, validate the ID token signature using a **pinned, issuer-owned RS256 JWKS source**. Reject token-supplied `jku`, `x5u`, `crit`, unsigned tokens and unexpected algorithms. Verify exact issuer, audience, authorized party when applicable, nonce, issuance time, expiry, and maximum token age.
- Return only stable issuer/subject and validity times from identity verification. Never treat roles, custom permissions, names or email claims in the token as authorization. Map roles separately in TPR-08.
- Issue a host-only, HttpOnly, Secure, SameSite=Lax HMAC-signed application session with at most 15 minutes validity. `__Host-tpr_session` cookies must be set only by secure backend handlers.
- Expired/revoked accounts and sessions must be checked against durable identity/session records before enabling real user operations. Login registers only a stable issuer/subject in `tpr_private.oidc_members`; roles and profile claims are not imported. A disabled member cannot log in again. Authenticated handlers must call `verifyRegisteredSession`, which checks session revocation and member disablement. Trusted account administration calls `disableMemberIdentity` to tombstone a member and revoke its sessions atomically. Logout revokes the stored session before clearing its cookie.
- OIDC metadata/JWKS changes and algorithm upgrades require an explicit reviewed configuration change; no browser may provide a JWKS URL.
- All user-controlled state and claims are untrusted until validated on the backend; never log raw tokens, signing secrets, authorization codes, or full identity assertions.

## Portable integration contract

Modules: `lib/auth/oidc-login.ts` (authorization parameters), `lib/auth/oidc-pending-store.ts` (browser-bound one-time state), `lib/auth/oidc-exchange.ts` (code exchange), `lib/auth/trusted-jwks.ts` (pinned key fetching), `lib/auth/oidc-id-token.ts` (signature and claims), `lib/auth/session.ts` (signed cookie) and `lib/auth/oidc-session-store.ts` (durable revocation). Routes are under `app/api/auth/`.

To replace the parent identity provider, supply verified configuration including issuer, authorization endpoint, client ID, redirect URI and JWKS URI. Same-origin issuer/JWKS and authorization endpoints are required in this first profile. A different trusted provider topology requires an explicit ADR and negative security tests; never loosen validation simply to make login work.

Test fixtures generate synthetic RSA signing keys inside the test process. No sample production keys or tokens belong in Git.

## Remaining gates before TPR-07 can be accepted as operational

1. Verify the actual parent identity provider metadata, client registration and trusted redirect URI.
2. Verify the implemented start/callback/code exchange against the registered parent provider, including CSRF denial, expiry cleanup and provider error handling.
3. Verify token claims, persisted session invalidation/logout, HTTP cookie handling, CSRF boundaries and account deletion against that provider. Use a scoped runtime database role with only the necessary identity-table grants.
4. Prove unauthenticated/private API denials, refresh/logout and provider failover behavior in a running deployed environment.
5. Confirm E2EESA identity/authentication profile applicability and security-review evidence.

**These gates are not fulfilled by a passing unit test.** The app remains a preview that cannot accept personal or private data.

## Runtime configuration (names only)

The guarded routes require `DATABASE_URL`, `OIDC_ISSUER`, `OIDC_AUTHORIZATION_ENDPOINT`, `OIDC_TOKEN_ENDPOINT`, `OIDC_JWKS_URI`, `OIDC_CLIENT_ID`, `OIDC_REDIRECT_URI` and `SESSION_SIGNING_KEY` (at least 32 random bytes encoded as base64url). Use provider-managed secrets and a scoped database role. The token exchange currently supports a public PKCE client; a confidential-client registration needs reviewed support for client authentication before activation. No live provider values or keys are stored in this repository.
