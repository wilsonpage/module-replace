'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('module-replace');
var CoreModule = require('module');
var path = require('path');

var realResolve = CoreModule._resolveFilename;
var modules = {};

/**
 * Exports
 */

exports = module.exports = function(config) {
  return new Replacer(config);
};

function Replacer(config) {
  this.rootDir = (config && config.root) || __dirname;
  this.modules = {};
  debug('initialized', this.rootDir);
}

Replacer.prototype.module = function(filepath) {
  var id = getId(filepath, this.rootDir);
  var module = new Module(id, this.rootDir);
  return this.modules[id] = module;
};

Replacer.prototype.restore = function(filepath) {
  if (!arguments.length) return this.restoreAll();
  var id = getId(filepath, this.rootDir);
  this.restoreModule(this.modules[id]);
};

Replacer.prototype.restoreModule = function(module) {
  if (!module) return;
  delete this.modules[module.id];
  module.restore();
};

Replacer.prototype.restoreAll = function() {
  for (var key in this.modules) {
    this.modules[key].restore();
  }
};

function Module(id, rootDir) {
  if (modules[id]) throw new Error(`'${id}' is already replaced`);
  this.id = id;
  modules[this.id] = this;
  this.rootDir = rootDir;
  debug('initialized module', this.id);
}

Module.prototype.with = function(filepath) {
  if (!~filepath.indexOf('.js')) filepath += '.js';
  this.replacement = getId(filepath, this.rootDir);
  debug('replacement', this.replacement);
  return this;
};

Module.prototype.match = function(pathname, context) {
  var id = getId(pathname, path.resolve(context, '..'));
  debug('match', id, this.id);

  // remove .js extension
  id = id.replace(/\.js$/, '');

  return id === this.id ||
    `${id}/index` === this.id;
};

Module.prototype.restore = function() {
  delete modules[this.id];
  delete require.cache[this.replacement];
};

/**
 * Enable `require()` interception.
 *
 * @public
 */
exports.enable = function() {
  CoreModule._resolveFilename = function(request, parent) {
    return resolve(request, parent.filename)
      || realResolve(request, parent);
  };

  function resolve(request, context) {
    for (var key in modules) {
      let module = modules[key];
      if (module.match(request, context)) return module.replacement;
    }
  }
}

/**
 * Disable interception.
 *
 * @public
 */
exports.disable = function() {
  CoreModule._resolveFilename = realResolve;
}

/**
 * Utils
 */

function getId(pathname, rootDir) {
  return pathname.startsWith('.')
    ? path.resolve(rootDir, pathname)
    : pathname;
}

exports.enable();
