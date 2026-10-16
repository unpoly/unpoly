# Scripting chapter re-check (2026-10-16, R1)

The full read happened in the Scripting sitting 2026-10-06/07 (plan.md). Per Henning, that counts as the R1 read; only changes since then were reviewed.

- Repetition rule tuned down (writer-brief pattern 5): Getting started, overview and owner page may repeat a concern in shorter form. C20 dropped; B22 (/providing-html template example) left as is.
- /scripting: "The page is long-lived" section removed; the compiler section names the destructor mechanism without a second code example.
- /enhancing-elements, /data, /templates, /islands, /legacy-scripts: fix-round changes accepted.
- /script-security: new first section "Providing the CSP nonce {#meta-csp-nonce}" ("CSP nonce", not "document nonce"); the two repeated meta blocks became one sentence each; "Callbacks" split into "Callbacks in attributes {#attribute-callbacks}" (shim for #callbacks, references fixed) and "Callbacks in headers {#header-callbacks}" (X-Up-Open-Layer callbacks, nonce prefix, listener alternative: custom header read in up:fragment:loaded, setting event.renderOptions.onAccepted).
Chapter done.
