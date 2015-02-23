'use strict';

/**
 * Module dependencies.
 */

var checks = require('./checks');
var strategies = require('./strategies');

/**
 * Register plugin.
 */

function register(client, options) {
  var retry;
  var strategy;

  switch (typeof options.strategy) {
    case 'string':
      strategy = strategies[options.strategy];
      break;
    case 'function':
      strategy = options.strategy;
      break;
    default:
      strategy = strategies.exponential;
      break;
  }

  if (typeof strategy !== 'function') {
    throw new Error('papi-retry failed to load strategy');
  }

  if (typeof options.retry === 'function') {
    retry = options.retry;
  } else {
    retry = checks.simple(options);
  }

  client._ext('onResponse', function(request, next) {
    if (!request.err) return next();

    try {
      if (request.opts.hasOwnProperty('retry')) {
        var optsRetry = request.opts.retry;

        if (optsRetry === false) {
          return next();
        } else if (typeof optsRetry === 'function') {
          if (!optsRetry(request)) return next();
        } else if (!retry(request)) {
          return next();
        }
      } else if (!retry(request)) {
        return next();
      }

      // default strategy
      if (!request.state.retry) {
        request.state.retry = strategy(options.options);
      }

      var delay = request.state.retry.next(request.res);

      setTimeout(request.retry, delay);
    } catch (err) {
      client._log(['papi-retry'], err.message);

      next();
    }
  });
}

/**
 * Register attributes
 */

register.attributes = require('../package.json');

/**
 * Module exports.
 */

exports.checks = checks;
exports.register = register;
exports.strategies = strategies;
