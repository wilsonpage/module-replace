
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

    describe('restore', function() {
      it('restores the replacement', function() {
        this.replacement.restore();

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
});
