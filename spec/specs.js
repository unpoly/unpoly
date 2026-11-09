// Detect once whether the terminal harness (bin/test.mjs) is driving us. It
// installs the window.__postToTerminal binding before any page script runs, so
// this is set before the helpers below read specs.drivenByTerminal.
window.specs.drivenByTerminal = !!window.__postToTerminal

// Helpers are order-independent, so we let webpack pick them all up.
var helpers = require.context('./helpers', true, /\.js$/)
helpers.keys().forEach(helpers)

// Spec files are required one by one, because not every spec file may be loaded on its
// own: a file extracted from an oversized group (see spec/helpers/extend_describe.js)
// declares its specs only when required from the position it was extracted from. Globbing
// the folder would load it at the root of the suite instead, silently.
//
// So every *_spec.js file below is a suite of its own, and every *_spec.js file that is
// missing from this list is extracted, and required by the file it was extracted from.
// A self-test (tooling/test/spec_manifest.test.mjs) keeps both halves honest.
require('./unpoly/browser_spec.js')
require('./unpoly/deprecated/modal_spec.js')
require('./unpoly/deprecated/popup_spec.js')
require('./unpoly/deprecated/tooltip_spec.js')
require('./unpoly/element/options_parser_spec.js')
require('./unpoly/element_spec.js')
require('./unpoly/error_spec.js')
require('./unpoly/event/event_emitter_spec.js')
require('./unpoly/event_spec.js')
require('./unpoly/form/params_spec.js')
require('./unpoly/form_spec.js')
require('./unpoly/fragment/render/render_options_spec.js')
require('./unpoly/fragment/render/response_doc_spec.js')
require('./unpoly/fragment/selector_spec.js')
require('./unpoly/fragment_spec.js')
require('./unpoly/framework_spec.js')
require('./unpoly/history_spec.js')
require('./unpoly/layer/base_spec.js')
require('./unpoly/layer/modes/drawer_layer_spec.js')
require('./unpoly/layer/modes/modal_layer_spec.js')
require('./unpoly/layer/modes/overlay_spec.js')
require('./unpoly/layer/modes/overlay_with_tether_spec.js')
require('./unpoly/layer/modes/overlay_with_viewport_spec.js')
require('./unpoly/layer/modes/popup_layer_spec.js')
require('./unpoly/layer/modes/root_layer_spec.js')
require('./unpoly/layer_spec.js')
require('./unpoly/link_spec.js')
require('./unpoly/log_spec.js')
require('./unpoly/migrate_spec.js')
require('./unpoly/motion_spec.js')
require('./unpoly/network/request_cache_spec.js')
require('./unpoly/network/request_spec.js')
require('./unpoly/network/response_spec.js')
require('./unpoly/network_spec.js')
require('./unpoly/protocol_spec.js')
require('./unpoly/radio_spec.js')
require('./unpoly/rails_spec.js')
require('./unpoly/script/csp/csp_info_spec.js')
require('./unpoly/script/csp/nonceable_callback_spec.js')
require('./unpoly/script_spec.js')
require('./unpoly/spec_spec.js')
require('./unpoly/spec_util_spec.js')
require('./unpoly/status/preview_spec.js')
require('./unpoly/status_spec.js')
require('./unpoly/util/config_spec.js')
require('./unpoly/util/fifo_cache_spec.js')
require('./unpoly/util/url_pattern_spec.js')
require('./unpoly/util_spec.js')
require('./unpoly/viewport_spec.js')

require('./specs.sass')
