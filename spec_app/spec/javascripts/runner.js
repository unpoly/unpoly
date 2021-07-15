const express = require('express');
const app = express();

const { execSync } = require('child_process')
// Can't use __dirname while /spec is a symlink
const cwd = execSync('pwd').toString().trim()

// app.use('dist', express.static(__dirname + '/../dist'));
/*
app.use('dist', express.static(cwd + '/dist'));
app.use('files', express.static(cwd + '/spec/files'));
*/

app.use(express.static(cwd))

app.listen(3000, function(){
  console.log("Listening on port 3000!")
});

app.get('/', function(req, res){
  res.sendFile(cwd + '/spec/runner.html');
});
