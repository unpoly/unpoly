# Rendering core deep-dive

> **TODO:** This guide is still an outline. The notes below are the intended scope,
> not finished prose.

- This is hard because rendering is so intricate
  - Multiple targets
  - Fallback targets
  - Response might not contain the targets we expect
  - Hungry elements
  - A response might update multiple layers, open a layer, or close a layer
  - Revalidation might cause a second request and render pass
  - Concurrent input (user clicks while already loading etc.)
  - Network issues
- Explain up.render with { url, response, ... }
- Explain up.RenderJob
- Explain up.Change.* classes
