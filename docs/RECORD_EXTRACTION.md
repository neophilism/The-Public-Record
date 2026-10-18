# Private record extraction classification

An isolated parser or OCR worker supplies page evidence linked to the request and original SHA-256. The classifier bounds it to 500 ordered pages and 2 million extracted characters and distinguishes native, scanned, mixed, empty, unsupported and failed records. OCR text is used only when the worker reports success. Every result remains `searchable: false`; extraction is never publication approval.

This component does not parse PDF/image formats or run OCR itself. Before processing real private uploads, integrate a sandboxed, resource-limited parser and installed OCR engine, prove their failure modes, retain source and page metadata, then obtain independent privacy/redaction review for any public derivative.
