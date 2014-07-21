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
    throw new Error('rapi-retry failed to load strategy');
  }

  if (typeof options.retry === 'function') {
    retry = options.retry;
  } else {
    retry = function(err, res) {
      if (Math.floor(res.statusCode / 100) !== 5) return false;

      return true;
    };
  }

  client._ext('onResponse', function(ctx, next) {
    if (!ctx.req) return next();
    if (!retry(ctx.err, ctx.res)) return next();

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
