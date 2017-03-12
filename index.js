
var fs = require('fs');
var os = require('os');
var path = require('path');
var exec = require('child_process').exec;
var _ = require('underscore');

var yauzl = require('yauzl')
var collect = require('collect-stream');
var tmp = require('temporary');
var output = new tmp.Dir();

module.exports = {
  _load: function(zip, filepath, callback) {
    var p1 = this.aapt(filepath);
    var p2 = this.icon(zip);

    Promise.all([p1, p2]).then(function(values) {
      callback(null, _.extend(values[0], values[1]));
    });
  },
  aapt: function(filepath) {
    return new Promise(function(resolve, reject) {
      var aapt = path.join(__dirname, 'bin', 'aapt_' + os.platform());
      var command = aapt + " d badging " + filepath;
      exec(command, function(error, stdout, stderr) {
        if (error) {
          reject(error);
        }
        else if (stdout) {
          var appName = stdout.match(/application: label='([^']+)'/)[1];
          var packageName = stdout.match(/name='([^']+)'/)[1];
          var versionName = stdout.match(/versionName='([^']+)'/)[1];
          var versionCode = stdout.match(/versionCode='(\d+)'/)[1];
          resolve({
            name: appName,
            identifier: packageName,
            version: versionName,
            versionCode: versionCode,
          });
        }
      });
    });
  },
  icon: function(zip) {
    return new Promise(function(resolve) {
      zip.on('entry', function(entry) {
        if (/res\/drawable\/icon\.png$/.test(entry.fileName)) {
          // read icon stream
          zip.openReadStream(entry, function(err, stream){
            // read buffer
            collect(stream, function(err, src){
              resolve({
                icon: src,
              });
            });
          });
        }
      });
    });
  },
  fromBuffer: function(buffer, callback) {
    var self = this;
    var filepath = output.path + '/package.apk';
    fs.writeFile(filepath, buffer, 'binary', function() {
      yauzl.fromBuffer(buffer, function(error, zip) {
        self._load(zip, filepath, callback);
      });
    });
  },
  fromPath: function(filepath, callback) {
    var self = this;
    var fd = fs.openSync(filepath, 'r');
    yauzl.fromFd(fd, function(error, zip) {
      self._load(zip, filepath, callback);
    });
  },
};
