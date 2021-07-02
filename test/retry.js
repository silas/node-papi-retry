"use strict";

const nock = require("nock");
const papi = require("papi");
const should = require("should");

const retry = require("../lib");

describe("retry", function () {
  describe("register", function () {
    beforeEach(function () {
      this.baseUrl = "http://example.org";

      this.client = new papi.Client(this.baseUrl);

      this.client._plugin(retry, { options: { minDelay: 0 } });
    });

    it("should accept strategy name", function () {
      this.client._plugin(retry, { strategy: "exponential" });
    });

    it("should accept strategy function", function () {
      this.client._plugin(retry, { strategy: () => {} });
    });

    it("should throw on invalid strategy", function () {
      should(() => {
        this.client._plugin(retry, { strategy: "fake" });
      }).throw("papi-retry failed to load strategy");
    });

    it("should accept retry function", function () {
      this.client._plugin(retry, { retry: () => {} });
    });
  });

  describe("ext", function () {
    before(function () {
      nock.disableNetConnect();
    });

    after(function () {
      nock.enableNetConnect();
    });

    beforeEach(function () {
      this.baseUrl = "http://example.org";

      this.client = new papi.Client({
        baseUrl: this.baseUrl,
        timeout: 10,
      });

      this.client._plugin(retry, { options: { minDelay: 0 } });

      this.nock = nock(this.baseUrl);
    });

    it("should retry", async function () {
      this.nock
        .get("/get")
        .reply(502, "error")
        .get("/get")
        .reply(408, "request timeout")
        .get("/get")
        .delayConnection(2000)
        .reply(201, "delay")
        .get("/get")
        .reply(200, { hello: "world" });

      let count = 0;
      this.client._ext("onRequest", (request, next) => {
        count += 1;
        next();
      });

      const res = await this.client._get("/get");
      should.exist(res);

      should(res.statusCode).equal(200);
      should(res.body).eql({ hello: "world" });

      should(count).equal(4);
    });

    it("should retry with opts retry", async function () {
      this.nock.get("/get").reply(500, "error").get("/get").reply(200);

      let count = 0;
      this.client._ext("onRequest", (request, next) => {
        count += 1;
        next();
      });

      const res = await this.client._get({
        path: "/get",
        retry: (request) => {
          return request.res.statusCode === 500;
        },
      });
      should.exist(res);
      should(count).equal(2);
    });

    it("should not retry", async function () {
      this.nock.get("/get").reply(200, { hello: "world" });

      let count = 0;
      this.client._ext("onRequest", (request, next) => {
        count += 1;
        next();
      });

      const res = await this.client._get("/get");
      should.exist(res);

      should(res.statusCode).equal(200);
      should(res.body).eql({ hello: "world" });

      should(count).equal(1);
    });

    it("should not retry with 500", async function () {
      this.nock.get("/get").reply(500, "error");

      let count = 0;
      this.client._ext("onRequest", (request, next) => {
        count += 1;
        next();
      });

      try {
        await this.client._get("/get");
        should.fail();
      } catch (err) {
        should(err.message).equal("internal server error");
      }
      should(count).equal(1);
    });

    it("should not retry with opts retry", async function () {
      this.nock.get("/get").reply(408, "error");

      let count = 0;
      this.client._ext("onRequest", (request, next) => {
        count += 1;
        next();
      });

      try {
        await this.client._get({
          path: "/get",
          retry: (request) => {
            return request.res.statusCode !== 408;
          },
        });
        should.fail();
      } catch (err) {
        // ignore error
      }
      should(count).equal(1);
    });

    it("should not retry when opts retry is false", async function () {
      this.nock.get("/get").reply(408, "error");

      let count = 0;
      this.client._ext("onRequest", (request, next) => {
        count += 1;
        next();
      });

      try {
        await this.client._get({
          path: "/get",
          retry: false,
        });
        should.fail();
      } catch (err) {
        should(err.message).equal("request timeout");
      }
      should(count).equal(1);
    });

    it("should retry when opts retry is true", async function () {
      this.nock.get("/get").reply(408, "error").get("/get").reply(200);

      let count = 0;
      this.client._ext("onRequest", (request, next) => {
        count += 1;
        next();
      });

      const res = await this.client._get({
        path: "/get",
        retry: true,
      });
      should.exist(res);

      should(count).equal(2);
    });

    it("should not retry 500s when retry is true", async function () {
      this.nock.get("/get").reply(408, "error").get("/get").reply(500);

      let count = 0;
      this.client._ext("onRequest", (request, next) => {
        count += 1;
        next();
      });

      try {
        await this.client._get({
          path: "/get",
          retry: true,
        });
        should.fail();
      } catch (err) {
        should(err.message).equal("internal server error");
      }

      should(count).equal(2);
    });

    it("should catch opts retry throw", async function () {
      this.nock.get("/get").reply(408);

      try {
        await this.client._get({
          path: "/get",
          retry: function () {
            throw new Error("retry");
          },
        });
        should.fail();
      } catch (err) {
        should(err.message).equal("request timeout");
      }
    });

    it("should retry on invalid request options", async function () {
      this.nock.get("/get").reply(503).get("/get").reply(200);

      try {
        await this.client._get();
        should.fail();
      } catch (err) {
        should(err).have.property("isValidation", true);
      }
    });

    it("should not retry on invalid request options", async function () {
      this.nock.get("/get").reply(500);

      try {
        await this.client._get({
          retry: [],
        });
        should.fail();
      } catch (err) {
        should(err).have.property("message", "path required");
      }
    });

    it("should not retry on unknown errors", async function () {
      let count = 0;
      this.client._ext("onRequest", (request, next) => {
        count += 1;
        next(new Error("fail"));
      });

      try {
        await this.client._get("/get");
        should.fail();
      } catch (err) {
        should(err.message).equal("fail");
      }
      should(count).equal(1);
    });

    it("should catch and ignore retry errors", async function () {
      this.nock
        .get("/get")
        .reply(500, "error")
        .get("/get")
        .reply(200, { hello: "world" });

      let count = 0;
      this.client._ext("onRequest", (request, next) => {
        count += 1;

        request.state.retry = () => {
          throw new Error("fail");
        };

        next();
      });

      try {
        await this.client._get("/get");
        should.fail();
      } catch (err) {
        should(err.message).equal("service unavailable");
      }
      should(count).equal(1);
    });
  });
});
