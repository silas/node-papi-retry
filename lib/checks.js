"use strict";

function simple(options) {
  const retryErrorCodes = options.retryErrorCodes || {
    ETIMEDOUT: true,
    ECONNREFUSED: true,
    EHOSTUNREACH: true,
  };

  const retryMethods = options.retryMethods || {
    GET: true,
    HEAD: true,
    OPTIONS: true,
  };

  const retryStatusCodes = options.retryStatusCodes || {
    408: true,
    502: true,
    503: true,
    504: true,
  };

  return (request) => {
    const err = request.err;

    if (err.code) {
      if (retryErrorCodes[err.code]) return true;
    }

    const req = request.req;

    if (!req || !retryMethods[req.method]) return false;

    if (err.isAbort) return false;
    if (err.isTimeout) return true;

    const res = request.res;

    if (!res) return false;
    if (retryStatusCodes[res.statusCode]) return true;

    return false;
  };
}

exports.simple = simple;
