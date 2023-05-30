const express = require('express');
const app = express();
const open = require('open')

const { execSync } = require('child_process')
// Can't use __dirname while /spec is a symlink
const cwd = execSync('pwd').toString().trim()

app.use(express.static(cwd))

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || 'localhost';
const URL = `http://${HOST}:${PORT}`

app.listen(PORT, HOST, function(){
  console.log(`Unpoly specs serving on ${URL}.`)
  console.log("Press CTRL+C to quit.")
  open(URL)
});

app.get('/', function(req, res){
  res.sendFile(cwd + '/spec/menu.html');
});

app.get('/specs', function(req, res){
  res.sendFile(cwd + '/spec/runner.html');
});
