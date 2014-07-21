'use strict';

/**
 * Module dependencies.
 */

var nock = require('nock');
var rapi = require('rapi');
var should = require('should');

var retry = require('../lib');

/**
 * Tests
 */

describe('rapi-retry', function() {
  describe('strategy', function() {
    describe('Exponential', function() {
      it('should work', function() {
        var s = retry.strategies.exponential();

        s.next().should.equal(1000);
        s.next().should.equal(2000);
        s.next().should.equal(4000);
        s.next().should.equal(8000);
        s.next().should.equal(10000);
        s.next().should.equal(10000);
        s.next().should.equal(10000);
        s.next().should.equal(10000);
        s.next().should.equal(10000);
        s.next().should.equal(10000);

        s.attempts.should.equal(10);

        (function() { s.next(); }).should.throw('stop retry');

        s.attempts.should.equal(10);

        (function() { s.next(); }).should.throw('stop retry');

        s.attempts.should.equal(10);
      });

      it('should use minDelay', function() {
        var s = retry.strategies.exponential({ minDelay: 50 });

        s.next().should.equal(50);
        s.next().should.equal(100);
        s.next().should.equal(200);
      });

      it('should use maxDelay', function() {
        var s = retry.strategies.exponential({ minDelay: 50, maxDelay: 100 });

        s.next().should.equal(50);
        s.next().should.equal(100);
        s.next().should.equal(100);
      });

      it('should use randomize', function() {
        var s = retry.strategies.exponential({ randomize: 1 });

        s.next().should.be.within(0, 1000);
        s.next().should.be.within(0, 2000);
        s.next().should.be.within(0, 4000);
        s.next().should.be.within(0, 8000);
        s.next().should.be.within(0, 10000);
        s.next().should.be.within(0, 10000);
        s.next().should.be.within(0, 10000);
        s.next().should.be.within(0, 10000);
        s.next().should.be.within(0, 10000);
        s.next().should.be.within(0, 10000);
      });
    });
  });

  describe('plugin', function() {
    before(function() {
      nock.disableNetConnect();
    });

    after(function() {
      nock.enableNetConnect();
    });

    beforeEach(function() {
      this.baseUrl = 'http://example.org';

      this.client = rapi.Client(this.baseUrl);

      this.client._plugin(retry, {
        options: { minDelay: 50 },
      });

      this.nock = nock(this.baseUrl);
    });

    it('should not retry', function(done) {
      this.nock
        .get('/get')
        .reply(200, { hello: 'world' });

      this.client._get('/get', function(err, res) {
        should.not.exist(err);
        should.exist(res);

        res.statusCode.should.eql(200);
        res.body.should.eql({ hello: 'world' });

        done();
      });
    });

    it('should retry', function(done) {
      this.nock
        .get('/get')
        .reply(500, 'error')
        .get('/get')
        .reply(500, 'error')
        .get('/get')
        .reply(500, 'error')
        .get('/get')
        .reply(200, { hello: 'world' });

      var start = new Date();

      this.client._get('/get', function(err, res) {
        should.not.exist(err);
        should.exist(res);

        res.statusCode.should.eql(200);
        res.body.should.eql({ hello: 'world' });

        (new Date() - start).should.be.within(140, 160);

        done();
      });
    });
  });
});
