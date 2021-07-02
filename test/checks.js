"use strict";

const should = require("should");

const retry = require("../lib");

describe("checks", function () {
  describe("simple", function () {
    it("should work", function () {
      const c = retry.checks.simple({});

      should(c({ err: { code: "ETIMEDOUT" } })).be.true();
      should(c({ err: { code: "ECONNREFUSED" } })).be.true();
      should(c({ err: { code: "EHOSTUNREACH" } })).be.true();
      should(c({ err: { code: "ECONNRESET" } })).be.false();

      should(c({ err: {}, req: { method: "POST" } })).be.false();
      should(c({ err: {}, req: { method: "PUT" } })).be.false();
      should(c({ err: {}, req: { method: "DELETE" } })).be.false();
      should(c({ err: {}, req: { method: "PATCH" } })).be.false();

      should(c({ err: { isAbort: true }, req: { method: "GET" } })).be.false();
      should(c({ err: { isTimeout: true }, req: { method: "GET" } })).be.true();

      should(c({ err: {}, req: { method: "GET" } })).be.false();

      should(
        c({ err: {}, req: { method: "GET" }, res: { statusCode: 408 } })
      ).be.true();
      should(
        c({ err: {}, req: { method: "GET" }, res: { statusCode: 502 } })
      ).be.true();
      should(
        c({ err: {}, req: { method: "GET" }, res: { statusCode: 503 } })
      ).be.true();
      should(
        c({ err: {}, req: { method: "GET" }, res: { statusCode: 504 } })
      ).be.true();

      should(
        c({ err: {}, req: { method: "GET" }, res: { statusCode: 200 } })
      ).be.false();
    });
  });
});
