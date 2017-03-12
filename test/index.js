var apkLoader = require('../');
var fs = require("fs");

var apk = __dirname + '/Preview.apk';

apkLoader.fromPath(apk, function(error, data) {
  if(error){
    throw error;
  }
  console.log(data);
  fs.writeFile('icon.png', data.icon, "binary", function(err) {
    console.log(err); // writes out file without error, but it's not a valid image
  });
});

// 
var buffer = fs.readFileSync(apk);
// var buffer = fs.readFileSync(apk, 'binary');
apkLoader.fromBuffer(buffer, function(error, data) {
  console.log(data);
});
