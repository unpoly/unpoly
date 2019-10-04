const express = require('express');
const app = express();

app.use('/dist', express.static('dist'));

app.listen(3000, function(){
  console.log("Listening on port 3000!")
});

app.get('/specs', function(req, res){
  res.sendFile(__dirname + '/spec/runner.html');
});
