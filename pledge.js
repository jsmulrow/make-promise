/*----------------------------------------------------------------
Promises Workshop: build the pledge.js deferral-style promise library
----------------------------------------------------------------*/
var $Promise = function() {
	this.state = 'pending';
	this.value = undefined;
	this.handlerGroups = [];
	this.updateCbs = [];
};

var Deferral = function() {
	this.$promise = new $Promise();
};

Deferral.prototype.resolve = function(obj) {
	if (this.$promise.state === "pending") {
		this.$promise.value = obj;
		// run through all handlers
		while(this.$promise.handlerGroups.length) {
			var handler = this.$promise.handlerGroups[0];
			if (handler.successCb) {
				try {
					var result = handler.successCb(this.$promise.value);
					if (result instanceof $Promise) {
						result.handlerGroups.unshift({
							forwarder: handler.forwarder
						});
					} else if (result) {
						handler.forwarder.resolve(result);
					}
				} catch (err) {
					handler.forwarder.reject(err);
				}
			} else {
				handler.forwarder.resolve(this.$promise.value);
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
			var handler = this.$promise.handlerGroups[0];
			if (handler.errorCb) {
				try {
					var result = handler.errorCb(this.$promise.value);
					if (result instanceof $Promise) {
						result.handlerGroups.unshift({
							forwarder: handler.forwarder
						});
					} else if (result) {
						handler.forwarder.resolve(result);
					}
				} catch (err) {
					handler.forwarder.reject(err);
				}
			} else {
				handler.forwarder.reject(this.$promise.value);
			}
			this.$promise.handlerGroups.shift();
		}
		this.$promise.state = 'rejected';
	}
};

Deferral.prototype.notify = function(info) {
	if (this.$promise.state === 'pending') {
		for (var i = 0; i < this.$promise.updateCbs.length; i++) {
			this.$promise.updateCbs[i](info);
		}
	}
};

$Promise.prototype.then = function(successCb, errorCb, updateCb) {
	var cbObj = {
		successCb: typeof successCb !== 'function' ? null : successCb,
		errorCb: typeof errorCb !== 'function' ? null : errorCb,
		forwarder: defer()
	};
	this.handlerGroups.push(cbObj);

	if (typeof updateCb === 'function') {
		this.updateCbs.push(updateCb);
	}

	if (this.state === 'resolved') {
		if(this.handlerGroups[0].successCb) {
			this.handlerGroups[0].successCb(this.value);
			// remove called functions
			this.handlerGroups.shift();
		}
	} else if (this.state === 'rejected') {
		if(this.handlerGroups[0].errorCb) {
			this.handlerGroups[0].errorCb(this.value);
			// remove called functions
			this.handlerGroups.shift();
		}
	}
	return cbObj.forwarder.$promise;
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
--------------------------------------------------------*/