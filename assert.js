'use strict';

function AssertationFailed(message) {
  this.message = message;
}

AssertationFailed.prototype = Object.create(Error.prototype);

function assert(test, message) {
  if (!Boolean(test)) {
    throw new AssertationFailed(
      message || 'unknown assertion error; given ' + message
    );
  }
}
