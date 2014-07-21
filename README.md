# Rapi Retry [![Build Status](https://travis-ci.org/silas/node-rapi-retry.png?branch=master)](https://travis-ci.org/silas/node-rapi-retry)

Add retry support to [Rapi][rapi] clients.

 * [Example](#example)
 * [License](#license)

## Example

``` javascript
var rapi = require('rapi');

var client = new rapi.Client('https://api.github.com');

client._plugin(require('rapi-retry'));
```

## License

This work is licensed under the MIT License (see the LICENSE file).

[rapi]: https://github.com/silas/node-rapi
