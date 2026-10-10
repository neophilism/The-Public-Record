# Local development bootstrap

This is a preview scaffold, not a live record-filing or confidential upload service.

## Requirements and run

Use Node.js 22+, npm, and Git.

```sh
npm install --no-audit --no-fund
npm run verify:baseline
npm run typecheck
npm test
npm run build
npm run dev
```

Open http://localhost:3000. GET /api/health reports `status=scaffold` and `production_ready=false`.

Only synthetic data from `fixtures/investigations.synthetic.json` may be used in tests. No real agency receipt, private uploaded evidence, or personal identifying data is included.

Optional container preview:

```sh
docker build -t public-record-preview .
docker run --rm -p 3000:3000 public-record-preview
```

A production-reviewed package lockfile and `npm ci` are still required for deterministic deployments. Authentication, private storage, database migration, publication approval, and FOIA submission features remain unimplemented. Never provision services or enable spending without explicit authorization. See the full development plan and P0 acceptance gates.
