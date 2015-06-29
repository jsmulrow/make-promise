/*----------------------------------------------------------------
Promises Workshop: build the pledge.js deferral-style promise library
----------------------------------------------------------------*/

// YOUR CODE HERE:
var $Promise = function() {
	this.state = 'pending';
	this.value = undefined;
	this.handlerGroups = [];
};

var Deferral = function() {
	this.$promise = new $Promise();
};

Deferral.prototype.resolve = function(obj) {
	if (this.$promise.state === "pending") {
		this.$promise.value = obj;
		// run through all handlers
		while(this.$promise.handlerGroups.length) {
			if (this.$promise.handlerGroups[0].successCb) {
				// catch errors
				try {
					// check for return value
					console.log(this.$promise.handlerGroups[0].successCb.toString());
					var result = this.$promise.handlerGroups[0].successCb(this.$promise.value);
					// assimilate returned promises
					if (result instanceof $Promise) {
						console.log(result, result.state, result.value);
						console.log('it was an instance of');
						console.log(this.$promise.handlerGroups[0].forwarder.$promise);
						this.$promise.handlerGroups[0].forwarder.$promise = result;
						result.jack = 'jack';
						console.log(this.$promise.handlerGroups[0].forwarder.$promise);

					}
					// pass data values to next promise
					else if (result) {
						this.$promise.handlerGroups[0].forwarder.resolve(result);
					}
				} catch (err) {
					this.$promise.handlerGroups[0].forwarder.reject(err);
				}
			} else {
				// if no successCb, pass value to forwarder
				this.$promise.handlerGroups[0].forwarder.resolve(this.$promise.value);
			}
			this.$promise.handlerGroups.shift();
		}

		this.$promise.state = 'resolved';
	}
};

Deferral.prototype.reject = function(obj) {
	if (this.$promise.state === "pending") {
		this.$promise.value = obj;
		// run through all handlers
		while(this.$promise.handlerGroups.length) {
			if (this.$promise.handlerGroups[0].errorCb) {
				// catch errors
				try {
					// check for return value
					var result = this.$promise.handlerGroups[0].errorCb(this.$promise.value);
					if (result instanceof $Promise) {

					}
					if (result) {
						this.$promise.handlerGroups[0].forwarder.resolve(result);
					}
				} catch (err) {
					this.$promise.handlerGroups[0].forwarder.reject(err);
				}
			} else{
				this.$promise.handlerGroups[0].forwarder.reject(this.$promise.value);
			}
			this.$promise.handlerGroups.shift();
		}

		this.$promise.state = 'rejected';
	}
};

$Promise.prototype.then = function(successCb, errorCb) {
	// store forwarder for later
	var forwarder = new Deferral();
	var cbObj = {
		successCb: typeof successCb !== 'function' ? null : successCb,
		errorCb: typeof errorCb !== 'function' ? null : errorCb,
		forwarder: forwarder
	};
	this.handlerGroups.push(cbObj);
	if (this.state === 'resolved') {
		if(this.handlerGroups[0].successCb) {
			this.handlerGroups[0].successCb(this.value);
			// remove called functions
			this.handlerGroups.shift();
		} else {
			forwarder.resolve(this.value);
		}
	} else if (this.state === 'rejected') {
		if(this.handlerGroups[0].errorCb) {
			this.handlerGroups[0].errorCb(this.value);
			// remove called functions
			this.handlerGroups.shift();
		} else {
			forwarder.reject(this.value);
		}
	}
	// return new deferal
	return forwarder.$promise;
};

$Promise.prototype.catch = function(errorCb) {
	return this.then(null, errorCb);
};

var defer = function() {
	return new Deferral();
};






/*-------------------------------------------------------
The spec was designed to work with Test'Em, so we don't
actually use module.exports. But here it is for reference:

module.exports = {
  defer: defer,
};

So in a Node-based project we could write things like this:

var pledge = require('pledge');
…
var myDeferral = pledge.defer();
var myPromise1 = myDeferral.$promise;
-------------------------------------------------------- */