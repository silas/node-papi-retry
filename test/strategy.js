'use strict';

/**
 * Module dependencies.
 */

var retry = require('../lib');

/**
 * Tests
 */

describe('strategy', function() {
  describe('Exponential', function() {
    it('should work', function() {
      var s = retry.strategies.exponential();

      s.next().should.equal(1000);
      s.next().should.equal(2000);
      s.next().should.equal(4000);
      s.next().should.equal(8000);
      s.next().should.equal(10000);

      s.attempts.should.equal(5);

      (function() { s.next(); }).should.throw('stop retry');

      s.attempts.should.equal(5);

      (function() { s.next(); }).should.throw('stop retry');

      s.attempts.should.equal(5);
    });

    it('should set min retries', function() {
      retry.strategies.exponential({ retries: -1 }).retries.should.equal(0);
    });

    it('should use retries', function() {
      var s = retry.strategies.exponential({ retries: 1 });

      s.next().should.equal(1000);

      (function() { s.next(); }).should.throw('stop retry');
    });

    it('should set min factor', function() {
      retry.strategies.exponential({ factor: 0.5 }).factor.should.equal(1);
    });

    it('should use factor', function() {
      var s = retry.strategies.exponential({ factor: 10, maxDelay: 1000000 });

      s.next().should.equal(1000);
      s.next().should.equal(10000);
      s.next().should.equal(100000);
    });

    it('should set min minDelay', function() {
      retry.strategies.exponential({ minDelay: 0.25 }).minDelay.should.equal(1);
    });

    it('should ensure maxDelay is above minDelay', function() {
      var s = retry.strategies.exponential({ minDelay: 100, maxDelay: 50 });

      s.minDelay.should.equal(100);
      s.maxDelay.should.equal(100);
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

    it('should ensure randomize is between 1 and 2', function() {
      retry.strategies.exponential({ randomize: 0 }).randomize.should.equal(1);
      retry.strategies.exponential({ randomize: 0.99 }).randomize.should.equal(1);
      retry.strategies.exponential({ randomize: 1 }).randomize.should.equal(1);
      retry.strategies.exponential({ randomize: 1.5 }).randomize.should.equal(1.5);
      retry.strategies.exponential({ randomize: 2 }).randomize.should.equal(2);
      retry.strategies.exponential({ randomize: 2.01 }).randomize.should.equal(2);
    });

    it('should use randomize', function() {
      var s;
      var maxValues = [1000, 2000, 4000, 8000, 10000];
      var r = {};

      var check = function(s) {
        return function(max) {
          var n = s.next();

          n.should.be.within(0, max);

          if (!r.hasOwnProperty(n)) r[n] = 0;
          r[n]++;
        };
      };

      var iter = 100;

      for (var i = 0; i < iter; i++) {
        s = retry.strategies.exponential({ randomize: 1 });
        maxValues.forEach(check(s));
      }

      Object.keys(r).length.should.be.above(iter * maxValues.length * 0.5);
    });
  });
});
