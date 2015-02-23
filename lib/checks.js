'use strict';

/**
 * Module dependencies.
 */

function simple(options) {
  var retryErrorCodes = options.retryErrorCodes || {
    ETIMEDOUT: true,
    ECONNREFUSED: true,
    EHOSTUNREACH: true,
  };

  var retryMethods = options.retryMethods || {
    GET: true,
    HEAD: true,
    OPTIONS: true,
  };

  var retryStatusCodes = options.retryStatusCodes || {
    408: true,
    502: true,
    503: true,
    504: true,
  };

  return function(request) {
    var err = request.err;

    if (err.code) {
      if (retryErrorCodes[err.code]) return true;
    }

    var req = request.req;

    if (!req || !retryMethods[req.method]) return false;

    if (err.isAbort) return false;
    if (err.isTimeout) return true;

    var res = request.res;

    if (!res) return false;
    if (retryStatusCodes[res.statusCode]) return true;

    return false;
  };
}

/**
 * Module exports.
 */

exports.simple = simple;
