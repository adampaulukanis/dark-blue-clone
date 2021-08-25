'use strict';

function AssertationFailed (message) {
  this.message = message;
}

AssertationFailed.prototype = Object.create(Error.prototype);

function assert (test, message) {
  if (!test) {
    throw new AssertationFailed(message);
  }
}
