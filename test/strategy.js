"use strict";

const should = require("should");

const retry = require("../lib");

describe("strategy", function () {
  describe("Exponential", function () {
    it("should work", function () {
      const s = retry.strategies.exponential();

      should(s.next()).equal(1000);
      should(s.next()).equal(2000);
      should(s.next()).equal(4000);
      should(s.next()).equal(8000);
      should(s.next()).equal(10000);

      should(s.attempts).equal(5);

      should(() => {
        s.next();
      }).throw("stop retry");

      should(s.attempts).equal(5);

      should(() => {
        s.next();
      }).throw("stop retry");

      should(s.attempts).equal(5);
    });

    it("should set min retries", function () {
      should(retry.strategies.exponential({ retries: -1 }).retries).equal(0);
    });

    it("should use retries", function () {
      const s = retry.strategies.exponential({ retries: 1 });

      should(s.next()).equal(1000);

      should(function () {
        s.next();
      }).throw("stop retry");
    });

    it("should set min factor", function () {
      should(retry.strategies.exponential({ factor: 0.5 }).factor).equal(1);
    });

    it("should use factor", function () {
      const s = retry.strategies.exponential({ factor: 10, maxDelay: 1000000 });

      should(s.next()).equal(1000);
      should(s.next()).equal(10000);
      should(s.next()).equal(100000);
    });

    it("should set min minDelay", function () {
      should(retry.strategies.exponential({ minDelay: 0.25 }).minDelay).equal(
        1
      );
    });

    it("should ensure maxDelay is above minDelay", function () {
      const s = retry.strategies.exponential({ minDelay: 100, maxDelay: 50 });

      should(s.minDelay).equal(100);
      should(s.maxDelay).equal(100);
    });

    it("should use minDelay", function () {
      const s = retry.strategies.exponential({ minDelay: 50 });

      should(s.next()).equal(50);
      should(s.next()).equal(100);
      should(s.next()).equal(200);
    });

    it("should use maxDelay", function () {
      const s = retry.strategies.exponential({ minDelay: 50, maxDelay: 100 });

      should(s.next()).equal(50);
      should(s.next()).equal(100);
      should(s.next()).equal(100);
    });

    it("should ensure randomize is between 1 and 2", function () {
      should(retry.strategies.exponential({ randomize: 0 }).randomize).equal(1);
      should(retry.strategies.exponential({ randomize: 0.99 }).randomize).equal(
        1
      );
      should(retry.strategies.exponential({ randomize: 1 }).randomize).equal(1);
      should(retry.strategies.exponential({ randomize: 1.5 }).randomize).equal(
        1.5
      );
      should(retry.strategies.exponential({ randomize: 2 }).randomize).equal(2);
      should(retry.strategies.exponential({ randomize: 2.01 }).randomize).equal(
        2
      );
    });

    it("should use randomize", function () {
      let s;
      const maxValues = [1000, 2000, 4000, 8000, 10000];
      const r = {};

      const check = function (s) {
        return function (max) {
          const n = s.next();

          should(n).be.within(0, max);

          if (!r.hasOwnProperty(n)) r[n] = 0;
          r[n]++;
        };
      };

      const iter = 100;

      for (let i = 0; i < iter; i++) {
        s = retry.strategies.exponential({ randomize: 1 });
        maxValues.forEach(check(s));
      }

      should(Object.keys(r).length).be.above(iter * maxValues.length * 0.5);
    });
  });
});
