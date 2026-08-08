// Stub: pulls the terminal poster (which lives with the rest of the runner in
// runner/) into the specs bundle so require.context() discovers it. All logic is
// in runner/terminal/poster.js; it self-activates only when driven by the terminal.
import '../../runner/terminal/poster.js'
