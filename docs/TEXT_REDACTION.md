# Text derivative boundary

For UTF-8 plain text only, an independently approved review gate binds a consent record, reviewer and source SHA-256 to removal ranges. The output is newly constructed text; removed spans and original bytes are absent from the returned derivative. Its hash supports source-to-derivative traceability. The derivative remains private until a separate publication authorization and preview.

This does not redact PDF, image or Office bytes. Those formats require rendering to a new flattened derivative and tests that extraction, copy/paste, metadata and alternate layers cannot recover removed content. Automated PII detection is advisory; human QC must approve the actual final derivative. No public URL is produced by this module.
