# Live fragments chapter sitting (2026-10-15, full read per decision R1)

- /live-fragments: intro rewritten as a definition ("elements that update without being targeted by a link or form … load lazily, poll, react to server events, or piggy-back on other responses"), dropping the "no persistent connection" claim; new overview sections "Infinite scrolling" and "Real-time updates" (with the SSE compiler) replace "Also in this topic"; X-Up-Target sentence replaced by a pointer to /optimizing-responses.
- /lazy-loading: performance section names FCP only (INP claim dropped); duplicate infinite scrolling pointer in the reveal section dropped.
- /infinite-scrolling: unchanged.
- /polling: tip pointing to /real-time-updates added after the intro. C14: the "1 KB" sentence stays here (fix the literal copy at the Backend integration sitting).
- /real-time-updates: "Why reload instead of sending HTML" became "Reloading or pushing HTML {#reload-vs-push}", weighing existing routes/auth against no extra request; many simultaneous reloads answered by 304s or pushed HTML; stray up.render() sentence moved there. Swallowed-click concern (reload aborts a pending user request) dropped: users usually target larger areas than the reloaded fragment.
- /hungry-elements: "keep hungry elements to a few layout elements" moved into the intro (the mechanism is often overused); subnavigation example merged into one sentence; [up-flashes] links to /flashes.
- /flashes: unchanged (fix-round sentences checked).
Chapter done.
