'use strict';

/**
 * Module dependencies.
 */

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
    retry = function(ctx) {
      var err = ctx.err;
      var res = ctx.res;

      // retry client timeouts
      if (err && err.isTimeout) return true;

      if (!res) return false;

      // retry request timeouts
      if (res.statusCode === 408) return true;

      // retry 5xx's
      if (Math.floor(res.statusCode / 100) === 5) return true;

      return false;
    };
  }

  client._ext('onResponse', function(ctx, next) {
    if (!retry(ctx)) return next();

    // default strategy
    if (!ctx.state.retry) {
      ctx.state.retry = strategy(options.options);
    }

    try {
      var delay = ctx.state.retry.next(ctx.res);

      setTimeout(ctx.retry, delay);
    } catch (err) {
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

exports.register = register;
exports.strategies = strategies;
