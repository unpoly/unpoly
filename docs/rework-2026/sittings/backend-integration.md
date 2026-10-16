# Backend integration chapter sitting (2026-10-16, full read per decision R1)

- Anchor policy (documentation.md): paths get .htaccess redirects; renamed/moved anchors only get their internal links updated, no `<a id>` shims. All 24 existing shims removed (689d57493).
- /backend-integration: unchanged. C14 dropped under the tuned repetition rule (short forms on the overview are expected).
- /optimizing-responses: "Keep rendering them in shortened responses, or they stop updating" removed (hungry elements update opportunistically; rendering them only sometimes is fine), replaced by "They are updated whenever a response happens to contain them."; multi-target example uses `.menu, .breadcrumbs` instead of the hungry `.flashes`.
- /conditional-requests: RFC 7232 → RFC 9110; tip with framework helpers (Rails fresh_when/stale?, Django @condition, Symfony/Laravel isNotModified).
- /handling-asset-changes: <head> example made consistent (team page); "Aborting the render pass" shows preventDefault + up.network.loadPage(event.renderOptions).
- /server-protocol: unchanged.
Chapter done.
