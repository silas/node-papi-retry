# Papi Retry [![Build Status](https://travis-ci.org/silas/node-papi-retry.png?branch=master)](https://travis-ci.org/silas/node-papi-retry)

Add retry support to [Papi][papi] clients.

 * [Example](#example)
 * [License](#license)

## Example

``` javascript
var papi = require('papi');

var client = new papi.Client('https://api.github.com');

client._plugin(require('papi-retry'));
```

## License

This work is licensed under the MIT License (see the LICENSE file).

[papi]: https://github.com/silas/node-papi
