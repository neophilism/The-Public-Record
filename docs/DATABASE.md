# TPR-06: Database and migration operations

## Status and ownership

This is a **local/CI schema baseline**, not a production database deployment. The database has no live API handlers and must not receive real participant information until identity, access-control, private storage and operational gates are accepted.

- `tpr_public` schema: public questions, source citations and verified agency metadata. Public metadata is not automatically validated truth.
- `tpr_private` schema: draft requests, evidence events, quarantine object references and item-specific publication grants. No private binary is stored directly in SQL.
- Event and file rows use composite `(id, owner_subject)` foreign-key relationships to prevent accidental cross-owner linking.
- Row-level security is enabled and forced on user-owned private tables. Policies compare `owner_subject` to `current_setting('tpr.subject',true)`; absent subject yields no rows.
- This setting is **not an authentication mechanism**. Only a trusted backend may assign it after verifying a session. Never expose direct SQL connectivity or let a browser choose a subject.

## Migrations

Migrations are ordered numeric SQL files under `db/migrations` and run in a transaction with a PostgreSQL advisory lock. The ledger in `tpr_private.schema_migrations` stores immutable SHA-256 digests of every applied file. Attempting to change an applied migration fails and rolls back; publish a new numbered migration instead.

Set `DATABASE_URL` through an authorized secret store and explicitly run:

```sh
npm run db:migrate
```

The command does **not** create a cloud database or incur authorized paid storage. It does not run automatically at app startup. Do not use another project's database or credentials.

## Verification

CI runs PostgreSQL 16 in an isolated service and sets `TEST_DATABASE_URL` to disposable, test-only credentials. Integration tests verify clean migration, idempotent rerun, drift rollback, referential constraints and an RLS cross-owner read denial. Outside CI, database tests skip when that test-only environment variable is absent; this is **not** a passed integration check in a local no-database run.

## Production backlog

TPR-07/08: signed identity and service authorization, transaction-local trusted subject binding, ownership/role tests and SQL-injection defenses.
TPR-09/28: private object storage, scan quarantine, quotas, encryption/key management.
TPR-10/30–32: immutable event logs, grant persistence, approved public derivatives, correction and withdrawal.
TPR-47–52: authorized production migration, backups, restore drill, observability, security review.

No public-derivative table or public file endpoint is activated by this migration. Private originals must never become public by copying a quarantine storage key.
