# module-replace

## Replacing

```js
var replace = require('module-replace')();

replace
  .module('./foo')
  .with('./bar');

require('./foo') // => (bar exports)
```

```js
var replace = require('module-replace')();

replace
  .module('some-libray')
  .with('./some-library-mock');

require('./foo') // => (some-library-mock exports)
```

```js
var replace = require('module-replace')();

replace
  .module('./foo')
  .exports({ myMethod: function(){ ... } });

require('./foo') // => { myMethod: ... }
```

## Restoring

```js
var replace = require('module-replace')();

var replacement = replace
  .module('./foo')
  .with('./bar');

// do stuff ...

replacement.restore();
```

```js
var replace = require('module-replace')();

replace
  .module('./foo')
  .with('./bar');

replace
  .module('./beep')
  .with('./boop');

// do stuff ...

// restore all
replace.restore();
```

### Defining root directory

Defaults to `process.cwd()`

```js
var replace = require('module-replace')({ root: __dirname });

replace
  .module('../foo')
  .with('../bar')
```
