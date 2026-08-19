// Unpoly's log is off by default (up.log.config.enabled). On a scratch page it is the whole
// point: every render, target match, layer change and request narrates itself to the
// console, which is what a browser tool — or a human with devtools open — can actually
// read. Setting the config rather than calling up.log.enable() keeps it to this page;
// nothing persists.
up.log.config.enabled = true
