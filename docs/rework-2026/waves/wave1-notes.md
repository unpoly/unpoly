# Wave 1 writer reports (condensed, for critic + sitting)

## Forms batch 1 (8c2def973..252ebba61)
Escalations: title "Submitting forms in-place"→"Submitting forms"; @signature added to switching-form-state; up.form module keeps 7 learn-refs (final sweep); batch 2 owes handling-all-forms intro + `push(['form'])` bug + pointer to submitting-forms#navigation-defaults.
Unverified carried claims: disabling-forms "Focus preservation"; reactive-server-forms "in-flight validation aborted on submit".
Fixed old bugs: up-validate on <label>; duplicate id; style.highlight; formaction typos.

## Loading state (032d4402f..8dd8e98a6)
Escalations: overview ~380 words (<400 guidance); network-issues boundary line in "Also in this topic" (other topic); progress-bar in tail not map.
Reference bugs (not fixed): preview.js ~852 example calls preview.openOverlay (method is openLayer); preview.js ~749 swapContent('body') example; "will be shown temporary overlay" grammar (preview.js:726, params/up-follow/loading-state.md).
Learn-refs missing for final sweep: [up-placeholder], [up-preview], up.preview(), up.Preview; up:network:late/recover maybe → progress-bar.
Correction: placeholders dynamic templates (text vs message, minimustache no spaces).

## Forms batch 2 (4244bf75a..e6a2d7902)
Unverified: flashes "One container per layer" overlay flashes render into the overlay's own container "preferably".
Nit: form.js config.fieldSelectors/submitButtonSelectors/anyButtonSelectors typed {string} but are arrays.

## Live fragments (4d05f0801..4c663ceae)
Unverified: hungry-elements "server is not told about hungry elements; include them even if you render only targeted fragments"; lazy-loading placeholder-height advice (general CSS); polling "Most polling requests find nothing changed" (framing).
Escalations: partials/defer-example.md `GET /path` should be `/menu`; [up-defer="hover"] undocumented; infinite-scrolling below threshold (promote?); @signature added to polling.
Learn-refs for sweep: [up-hungry], up:fragment:hungry, up.radio.config → hungry-elements; startPolling/stopPolling → polling#scripting.

## Critic (ce763e39a, c7e68aa03): all three READY. Build All links OK (718 files).
Judgment calls: 1 switching-form-state duplicate "intermediate expert" example (keep fwd link only); 2 lazy-loading "placeholder" term clash with Placeholders feature (say "deferred element"); 3 live-fragments "Every feature builds on the same move" (→ "Most features"); 4 forms blurb loose "then"; 5 custom-form-fields double bold; 6 validation Rails params.require(:user) vs email/password field names (pre-existing); 7 accept overview escalations as is.
