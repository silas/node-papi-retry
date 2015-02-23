/**
 * Exponential strategy
 */

'use strict';

/**
 * Initialize a new `Exponential` instance.
 */

function Exponential(options) {
  if (!(this instanceof Exponential)) {
    return new Exponential(options);
  }

  options = options || {};

  this.retries = options.hasOwnProperty('retries') ?
    options.retries : 5;

  if (this.retries < 0) this.retries = 0;

  this.factor = options.hasOwnProperty('factor') ?
    options.factor : 2;

  if (this.factor < 1) this.factor = 1;

  this.minDelay = options.hasOwnProperty('minDelay') ?
    options.minDelay : 1000;

  if (this.minDelay < 1) this.minDelay = 1;

  this.maxDelay = options.hasOwnProperty('maxDelay') ?
    options.maxDelay : 10000;

  if (this.maxDelay < this.minDelay) this.maxDelay = this.minDelay;

  if (options.hasOwnProperty('randomize')) {
    this.randomize = options.randomize;

    if (this.randomize < 1) {
      this.randomize = 1;
    } else if (this.randomize > 2) {
      this.randomize = 2;
    }
  }

  this.attempts = 0;
}

/**
 * Next delay
 */

Exponential.prototype.next = function() {
  if (this.attempts >= this.retries) {
    throw new Error('stop retry');
  }

  var random = this.randomize ? Math.random() * this.randomize : 1;

  return Math.min(
    random * this.minDelay * Math.pow(this.factor, this.attempts++),
    this.maxDelay
  );
};

/**
 * Module exports.
 */

exports.Exponential = Exponential;
