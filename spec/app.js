const express = require('express')
const app = express()
// const opn = require('opn')

const { execSync } = require('child_process')
// Can't use __dirname while /spec is a symlink
const cwd = execSync('pwd').toString().trim()

// The express.static middleware serves both JavaScripts from /dist
// and files we send with sendFile().
app.use(express.static(cwd))
app.set('views', cwd)
app.set('view engine', 'ejs')

const PORT = process.env.PORT || 4000
const HOST = process.env.HOST || 'localhost'
const URL = `http://${HOST}:${PORT}`

app.listen(PORT, HOST, function(){
  console.log(`Unpoly specs serving on ${URL}.`)
  console.log("Press CTRL+C to quit.")
  // opn(URL)
})

app.get('/', function(req, res){
  res.sendFile(cwd + '/spec/menu.html')
})

app.get('/specs', function(req, res){
  const headers = {}

  function parseBoolean(str) {
    return str === 'true' || str === '1'
  }

  const config = {
    'csp':     parseBoolean(req.query['csp']),
    'minify':  parseBoolean(req.query['minify']),
    'es6':     parseBoolean(req.query['es6']),
    'random':  parseBoolean(req.query['random']),
    'migrate': parseBoolean(req.query['migrate']),
  }

  if (config.csp) {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'nonce-spec-runner-nonce'",
      "style-src-elem 'self' 'nonce-spec-runner-nonce'",
      "style-src-attr 'unsafe-inline'",
      "img-src 'self' 'nonce-spec-runner-nonce' data:",
    ].join('; ')
  }

  res.set(headers).render('spec/runner', { config })
})
