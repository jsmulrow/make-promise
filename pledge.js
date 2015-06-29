/////////
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


Deferral.prototype.resolve = function(data) {
	// only resolve pending promises
	if (this.$promise.state === "pending") {
		// update promise values
		this.$promise.state = 'resolved';
		this.$promise.value = data;
		// run through all handlers
		this.$promise.callHandlers();
	}
};


Deferral.prototype.reject = function(reason) {
	// only reject pending promises
	if (this.$promise.state === "pending") {
		// update promise values
		this.$promise.state = 'rejected';
		this.$promise.value = reason;
		// run through all handlers
		this.$promise.callHandlers();
	}
};


Deferral.prototype.notify = function(info) {
	// only make notifications for pending promises
	if (this.$promise.state === 'pending') {
		// run through each updateCb (but don't delete any)
		for (var i = 0; i < this.$promise.updateCbs.length; i++) {
			this.$promise.updateCbs[i](info);
		}
	}
};


$Promise.prototype.then = function(successCb, errorCb, updateCb) {
	// create handler object to pass into handlerGroups array
	var cbObj = {
		successCb: typeof successCb !== 'function' ? null : successCb,	
		errorCb: typeof errorCb !== 'function' ? null : errorCb,
		forwarder: defer()
	};
	this.handlerGroups.push(cbObj);

	// if given updateCb function, save it
	if (typeof updateCb === 'function') {
		this.updateCbs.push(updateCb);
	}

	// if not pending
	if (this.state !== 'pending') {
		// call the handlers
		this.callHandlers();
	}

	// return forwarder's promise - allows for future control
	return cbObj.forwarder.$promise;
};


$Promise.prototype.catch = function(errorCb) {
	// just return .then (.catch is syntactic sugar for .then(null, errorCb))
	return this.then(null, errorCb);
};


$Promise.prototype.callHandlers = function() {
	// determine which handler to call based on state
	var handlerFuncName = this.state === 'resolved' ? 'successCb' : 'errorCb';
	// loop through all handler groups
	while(this.handlerGroups.length) {
		// extract current handler for convenience
		var handler = this.handlerGroups[0];
		// if the correct function exists (success for resolve, error for reject)
		if (handler[handlerFuncName]) {
			// use try statement to catch errors
			try {
				// capture result from running the correct function
				var result = handler[handlerFuncName](this.value);
				// assimilate if the function returned a promise
				if (result instanceof $Promise) {
					// add the handler group promise (returned by .then) to the result promises handler groups
					result.handlerGroups.unshift({
						successCb: null,
						errorCb: null,
						forwarder: handler.forwarder
					});
				} else if (result) {
					// pass data value results to the next handler as the resolve value
					handler.forwarder.resolve(result);
				}
			} catch (err) {
				// reject next promise with the caught error as the reason
				handler.forwarder.reject(err);
			}
		} else {
			// if there is no current function, bubble to the next handler (resolve or reject based on current state)
			if (this.state === 'resolved') {
				handler.forwarder.resolve(this.value);
			} else {
				handler.forwarder.reject(this.value);
			}
		}
		// remove old handler groups (each is only used once)
		this.handlerGroups.shift();
	}
};


var defer = function() {
	// encapsulate deferral creation
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
//////