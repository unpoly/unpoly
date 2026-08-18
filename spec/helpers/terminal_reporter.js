// Stub: pulls the terminal poster (which lives with the rest of the runner in
// tooling/) into the specs bundle so require.context() discovers it. All logic is
// in tooling/runner/browser/poster.js; it self-activates only when driven by the terminal.
import '../../tooling/runner/browser/poster.js'
