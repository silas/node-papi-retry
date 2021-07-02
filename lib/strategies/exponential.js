"use strict";

class Exponential {
  constructor(opts) {
    opts = opts || {};

    this.retries = opts.hasOwnProperty("retries") ? opts.retries : 5;

    if (this.retries < 0) this.retries = 0;

    this.factor = opts.hasOwnProperty("factor") ? opts.factor : 2;

    if (this.factor < 1) this.factor = 1;

    this.minDelay = opts.hasOwnProperty("minDelay") ? opts.minDelay : 1000;

    if (this.minDelay < 1) this.minDelay = 1;

    this.maxDelay = opts.hasOwnProperty("maxDelay") ? opts.maxDelay : 10000;

    if (this.maxDelay < this.minDelay) this.maxDelay = this.minDelay;

    if (opts.hasOwnProperty("randomize")) {
      this.randomize = opts.randomize;

      if (this.randomize < 1) {
        this.randomize = 1;
      } else if (this.randomize > 2) {
        this.randomize = 2;
      }
    }

    this.attempts = 0;
  }

  next() {
    if (this.attempts >= this.retries) {
      throw new Error("stop retry");
    }

    const random = this.randomize ? Math.random() * this.randomize : 1;

    return Math.min(
      random * this.minDelay * Math.pow(this.factor, this.attempts++),
      this.maxDelay
    );
  }
}

exports.Exponential = Exponential;
