# TPR-03 Security review register

This document lists credible failure modes and the measures required before production. It is not a claim that those measures have already been deployed.

| Area | Required controls | Verification package |
|---|---|---|
| Participant confidentiality | Server-side object authorization; minimal logs; session expiration | TPR-07–10 |
| File intake | Private quarantine; size and type limits; isolated scanning | TPR-09, TPR-28 |
| Publication decisions | Per-item grant, reviewer approval, derivative-only public projection | TPR-30–32 |
| Public research quality | Reliable citations, explicit confidence labels, correction history | TPR-11–18 |
| Integration boundaries | Versioned read-only archive schemas, least-privilege tokens | TPR-02, TPR-44–45 |
| Distributed publication | Specific informed opt-in and versioned correction signals | TPR-44 |
| Availability and cost | Resource ceilings, retry policy, operational recovery tests | TPR-49–52 |

Every sensitive access and publishing flow must have a negative authorization test before it becomes publicly accessible. Server-readable data should never be described as end-to-end encrypted against the server. No production user data may be accepted by the initial scaffold.

See [data-flow inventory](DATA_FLOWS.md) and [decision register](../DECISIONS.md).
