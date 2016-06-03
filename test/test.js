
/**
 * Dependencies
 */

var assert = require('assert');
var replacer = require('..');

describe('module-replace', function() {
  beforeEach(function() {
    this.replace = replacer({ root: __dirname });
  });

  afterEach(function() {
    this.replace.restore();
  });

  describe('relative paths', function() {
    it('replaces the module', function() {
      this.replacement = this.replace
        .module('./foo')
        .with('./bar');

      assert.equal(require('./foo'), 'bar');
    });

    describe('restore', function() {
      it('restores the replacement', function() {
        this.replacement.restore();
        assert.equal(require('./foo'), 'foo');
      });
    });
  });

  describe('node_modules', function() {
    it('replaces the module', function() {
      this.replacement = this.replace
        .module('fake-foo')
        .with('./foo');

      assert.equal(require('fake-foo'), 'foo');
    });

    describe('package paths', function() {
      beforeEach(function() {
        this.replace
          .module('react-native')
          .with('react-native-mock/build/react-native');
      });

      it('works', function() {
        assert(require('react-native').View);
      });
    });

    describe('restore', function() {
      beforeEach(function() {
        this.replacement.restore();
      });

      it('restores the replacement', function() {
        try {
          require('./foo');
          throw new Error('should have thrown');
        } catch (err) {}
      });
    });
  });

  describe('register existing module', function() {
    it('throws when replacing an already replaced module', function(done) {
      this.replace
        .module('./foo')
        .with('./bar');

      try {
        this.replace
          .module('./foo')
          .with('./bar');
        } catch(e) {
          done();
        }
    });
  });

  describe('defining exports', function() {
    beforeEach(function() {
      this.replace
        .module('fake-foo')
        .exports('stuff');
    })

    it('it returns given exports', function() {
      assert.equal(require('fake-foo'), 'stuff');
    });
  });

  describe('ignore', function() {
    it('does not replace if the ignore function returns true', function() {
      var replace = replacer({
        root: __dirname,
        ignore: (pathname, context) => {
          return !!~context.indexOf('baz');
        }
      });

      replace
        .module('./foo')
        .exports('replaced');

      assert.equal(require('./foo'), 'replaced');
      assert.equal(require('./baz'), 'foo', './foo.js replacement ignored from inside baz.js');
    });
  });
});
