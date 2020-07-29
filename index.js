
var fs = require('fs');
var _ = require('underscore');

var yauzl = require('yauzl')
var collect = require('collect-stream');
var tmp = require('temporary');
var output = new tmp.Dir();
const AppInfoParser = require('app-info-parser')

module.exports = {
  _load: function(zip, filepath, callback) {
    var p1 = this.aapt(filepath);
    var p2 = this.icon(zip);
    Promise.all([p1, p2]).then(function(values) {
      callback(null, _.extend(values[0], values[1]));
    });
  },
  aapt: async function(filepath) {
    return new Promise(async (resolve, reject) => {
      const parser = new AppInfoParser(filepath);
      const { package,  versionCode, versionName, application } = await parser.parse()
      const name = application.label[0];
      resolve({
        name, 
        identifier: package,
        versionCode, 
        version: versionName,
      })
    });
  },
  icon: function(zip) {
    return new Promise(function(resolve) {
      zip.on('entry', function(entry) {
        if (/res\/mipmap-xxhdpi-v26\/ic_launcher_foreground\.png$/.test(entry.fileName)) {
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
