// note we can also import/export in CS2

// fragment.js

function replace() {
}

function extract()  {
}

function three() {
}

export default { one, two }



// unpoly.js

import fragment from './fragment'
import modal from './modal'
import form from './form'

up = { fragment, modal, form }

// Add shorthand functions
up.replace = up.fragment.replace
up.submit = up.form.submit

window.up = up

export default up

