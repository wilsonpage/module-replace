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
  config = config || {};
  this.rootDir = config.root || __dirname;
  this.shouldIgnore = this.createShouldIgnore(config.ignore);
  this.modules = {};
  debug('initialized', this.rootDir);
}

Replacer.prototype.createShouldIgnore = function(ignore) {
  if (typeof ignore == 'function') return ignore;
  else return function() {}
};

Replacer.prototype.module = function(filepath) {
  debug('module', filepath);
  var id = getId(filepath, this.rootDir);
  var module = new Module(id, this);
  return this.modules[id] = module;
};

Replacer.prototype.restore = function(filepath) {
  debug('restore', filepath);
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
  debug('restore all');
  for (var key in this.modules) {
    this.modules[key].restore();
  }
};

function Module(id, replacer) {
  if (modules[id]) throw new Error(`'${id}' is already replaced`);
  this.id = id;
  modules[this.id] = this;
  this.replacer = replacer;
  debug('initialized module', this.id);
}

Module.prototype.with = function(filepath) {
  if (!~filepath.indexOf('.js')) filepath += '.js';
  this.replacement = getId(filepath, this.replacer.rootDir);
  debug('replacement', this.replacement);
  return this;
};

Module.prototype.exports = function(exports) {
  debug('exports', exports);

  require.cache[this.id] = {
    id: this.id,
    loaded: true,
    exports: exports
  };

  this.replacement = this.id;
  return this;
};

Module.prototype.match = function(pathname, context) {
  if (this.replacer.shouldIgnore(pathname, context)) return false;

  var id = getId(pathname, path.resolve(context, '..'));
  debug('match', id, this.id);

  return id === this.id
    || `${id}/index` === this.id;
};

Module.prototype.restore = function() {
  debug('restore');
  delete modules[this.id];
  delete require.cache[this.id];
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
      if (module.match(request, context)) {
        debug('replacement found', module.replacement);
        return module.replacement;
      }
    }
  }
}

/**
 * Disable interception.
 *
 * @public
 */
exports.disable = function() {
  debug('disable');
  CoreModule._resolveFilename = realResolve;
}

/**
 * Utils
 */

function getId(pathname, rootDir) {
  debug('get id', pathname, rootDir);

  // absolute
  if (pathname.startsWith('/')) return pathname;

  // relative
  if (pathname.startsWith('.')) return path.resolve(rootDir, pathname);

  // node_modules: try to resolve real node_module
  // location and assume it's a fake module if not found
  try { return realResolve(pathname, require.main); }
  catch(e) { return `fake_node_modules/${pathname}`; }
}

exports.enable();
