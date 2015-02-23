'use strict';

/**
 * Module dependencies.
 */

var nock = require('nock');
var papi = require('papi');
var should = require('should');

var retry = require('../lib');

/**
 * Tests
 */

describe('retry', function() {
  describe('register', function() {
    beforeEach(function() {
      this.baseUrl = 'http://example.org';

      this.client = papi.Client(this.baseUrl);

      this.client._plugin(retry, { options: { minDelay: 0 } });
    });

    it('should accept strategy name', function() {
      this.client._plugin(retry, { strategy: 'exponential' });
    });

    it('should accept strategy function', function() {
      this.client._plugin(retry, { strategy: function() {} });
    });

    it('should throw on invalid strategy', function() {
      var self = this;

      (function() {
        self.client._plugin(retry, { strategy: 'fake' });
      }).should.throw('papi-retry failed to load strategy');
    });

    it('should accept retry function', function() {
      this.client._plugin(retry, { retry: function() {} });
    });
  });

  describe('ext', function() {
    before(function() {
      nock.disableNetConnect();
    });

    after(function() {
      nock.enableNetConnect();
    });

    beforeEach(function() {
      this.baseUrl = 'http://example.org';

      this.client = papi.Client({
        baseUrl: this.baseUrl,
        timeout: 10,
      });

      this.client._plugin(retry, { options: { minDelay: 0 } });

      this.nock = nock(this.baseUrl);
    });

    it('should retry', function(done) {
      this.nock
        .get('/get')
        .reply(502, 'error')
        .get('/get')
        .reply(408, 'request timeout')
        .get('/get')
        .delayConnection(2000)
        .reply(201, 'delay')
        .get('/get')
        .reply(200, { hello: 'world' });

      var count = 0;
      this.client._ext('onRequest', function(ctx, next) { count += 1; next(); });

      this.client._get('/get', function(err, res) {
        should.not.exist(err);
        should.exist(res);

        res.statusCode.should.equal(200);
        res.body.should.eql({ hello: 'world' });

        count.should.equal(4);

        done();
      });
    });

    it('should retry with opts retry', function(done) {
      this.nock
        .get('/get')
        .reply(500, 'error')
        .get('/get')
        .reply(200);

      var count = 0;
      this.client._ext('onRequest', function(ctx, next) { count += 1; next(); });

      var opts = {
        path: '/get',
        retry: function(request) {
          return request.res.statusCode === 500;
        },
      };

      this.client._get(opts, function(err, res) {
        should.not.exist(err);
        should.exist(res);

        count.should.equal(2);

        done();
      });
    });

    it('should not retry', function(done) {
      this.nock
        .get('/get')
        .reply(200, { hello: 'world' });

      var count = 0;
      this.client._ext('onRequest', function(ctx, next) { count += 1; next(); });

      this.client._get('/get', function(err, res) {
        should.not.exist(err);
        should.exist(res);

        res.statusCode.should.equal(200);
        res.body.should.eql({ hello: 'world' });

        count.should.equal(1);

        done();
      });
    });

    it('should not retry with opts retry', function(done) {
      this.nock
        .get('/get')
        .reply(408, 'error');

      var count = 0;
      this.client._ext('onRequest', function(ctx, next) { count += 1; next(); });

      var opts = {
        path: '/get',
        retry: function(request) {
          return request.res.statusCode !== 408;
        },
      };

      this.client._get(opts, function(err, res) {
        should.exist(err);
        should.exist(res);

        count.should.equal(1);

        done();
      });
    });

    it('should not retry when opts retry is false', function(done) {
      this.nock
        .get('/get')
        .reply(408, 'error');

      var count = 0;
      this.client._ext('onRequest', function(ctx, next) { count += 1; next(); });

      var opts = {
        path: '/get',
        retry: false,
      };

      this.client._get(opts, function(err, res) {
        should.exist(err);
        should.exist(res);

        count.should.equal(1);

        done();
      });
    });

    it('should catch opts retry throw', function(done) {
      this.nock
        .get('/get')
        .reply(408);

      var opts = {
        path: '/get',
        retry: function() { throw new Error('retry'); },
      };

      this.client._get(opts, function(err, res) {
        should.exist(err);
        should.exist(res);

        done();
      });
    });

    it('should retry on invalid request options', function(done) {
      this.nock
        .get('/get')
        .reply(503)
        .get('/get')
        .reply(200);

      var opts = {
        path: '/get',
        retry: [],
      };

      this.client._get(opts, function(err, res) {
        should.not.exist(err);
        should.exist(res);

        done();
      });
    });

    it('should not retry on invalid request options', function(done) {
      this.nock
        .get('/get')
        .reply(500);

      var opts = {
        path: '/get',
        retry: [],
      };

      this.client._get(opts, function(err, res) {
        should.exist(err);
        should.exist(res);

        res.statusCode.should.equal(500);

        done();
      });
    });

    it('should not retry on unknown errors', function(done) {
      var count = 0;
      this.client._ext('onRequest', function(ctx, next) { count += 1; next(); });

      this.client._get('/get', function(err, res) {
        should.exist(err);
        should.not.exist(res);

        count.should.equal(1);

        done();
      });
    });

    it('should catch and ignore retry errors', function(done) {
      this.nock
        .get('/get')
        .reply(500, 'error')
        .get('/get')
        .reply(200, { hello: 'world' });

      var count = 0;
      this.client._ext('onRequest', function(ctx, next) {
        count += 1;

        ctx.state.retry = function() {
          throw new Error('fail');
        };

        next();
      });

      this.client._get('/get', function(err, res) {
        should.exist(err);
        should.exist(res);

        res.should.have.property('statusCode', 500);

        count.should.equal(1);

        done();
      });
    });
  });
});
