# Papi Retry

Add retry support to [Papi][papi] clients.

## Example

``` javascript
const papi = require('papi');

const client = new papi.Client('https://api.github.com');

client._plugin(require('papi-retry'));
```

## License

This work is licensed under the MIT License (see the LICENSE file).

[papi]: https://github.com/silas/node-papi
