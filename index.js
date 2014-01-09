var fs = require('fs');
var path = require('path');
var program = require('commander');
var colors = require('colors');
var ncp = require('ncp');
var S = require('string');

var packageJSON = require('./package.json');

exports.COMPONENT_DIR_REGEXP = /^component-(.+)$/;

exports.program = function() {
  return program.version(packageJSON.version);
};

exports.fail = function(msg) {
  if (typeof(msg) == 'object') throw msg;
  console.log("FAIL:".red, msg);
  process.exit(1);
};

exports.findComponents = function(dirname) {
  return fs.readdirSync(dirname).filter(function(filename) {
    return exports.COMPONENT_DIR_REGEXP.test(filename) &&
           fs.existsSync(path.join(dirname, filename, 'component.html'));
  });
};

exports.hackLayout = function(componentsDir) {
  function getOriginalLayout() {
    var origPath = layoutPath + '.original';

    if (!fs.existsSync(origPath))
      fs.writeFileSync(origPath, fs.readFileSync(layoutPath));

    return fs.readFileSync(origPath, 'utf-8');
  }

  var layoutPath = exports.resolve('node_modules/appmaker/views/layout.ejs');
  var components = exports.findComponents(componentsDir);
  var layout = getOriginalLayout();
  var comment = '    <!-- components from ' + componentsDir + ' -->\n';
  var chunk = comment + components.map(function(name) {
    return '    ' +
           '<link rel="import" href="/component/mozilla-appmaker/' + name +
           '/component.html">\n';
  });
  var LINK = '<link rel="import" href="/ceci/ceci-channel-menu.html">';

  fs.writeFileSync(layoutPath, layout.replace(LINK, LINK + '\n\n' + chunk));
};

exports.templatize = function(filename, values, cb) {
  fs.readFile(filename, {encoding: 'utf-8'}, function(err, data) {
    if (err) return cb(err);

    data = S(data).template(values, '${', '}').toString();
    fs.writeFile(filename, data, cb);
  });
};

exports.copyTemplate = function(options, cb) {
  ncp(__dirname + '/template', options.dirname, {
    clobber: true
  }, function(err) {
    if (err) return cb(err);

    exports.templatize(options.dirname + '/component.html', options, cb);
  });
};

exports.resolve = function(pathname) {
  return path.resolve(__dirname, pathname);
};
