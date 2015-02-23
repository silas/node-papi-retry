'use strict';

/**
 * Module dependencies.
 */

require('should');

var retry = require('../lib');

/**
 * Tests
 */

describe('checks', function() {
  describe('simple', function() {
    it('should work', function() {
      var c = retry.checks.simple({});

      c({ err: { code: 'ETIMEDOUT' } }).should.be.true;
      c({ err: { code: 'ECONNREFUSED' } }).should.be.true;
      c({ err: { code: 'EHOSTUNREACH' } }).should.be.true;
      c({ err: { code: 'ECONNRESET' } }).should.be.false;

      c({ err: {}, req: { method: 'POST' } }).should.be.false;
      c({ err: {}, req: { method: 'PUT' } }).should.be.false;
      c({ err: {}, req: { method: 'DELETE' } }).should.be.false;
      c({ err: {}, req: { method: 'PATCH' } }).should.be.false;

      c({ err: { isAbort: true }, req: { method: 'GET' } }).should.be.false;
      c({ err: { isTimeout: true }, req: { method: 'GET' } }).should.be.true;

      c({ err: {}, req: { method: 'GET' } }).should.be.false;

      c({ err: {}, req: { method: 'GET' }, res: { statusCode: 408 } }).should.be.true;
      c({ err: {}, req: { method: 'GET' }, res: { statusCode: 502 } }).should.be.true;
      c({ err: {}, req: { method: 'GET' }, res: { statusCode: 503 } }).should.be.true;
      c({ err: {}, req: { method: 'GET' }, res: { statusCode: 504 } }).should.be.true;

      c({ err: {}, req: { method: 'GET' }, res: { statusCode: 200 } }).should.be.false;
    });
  });
});
