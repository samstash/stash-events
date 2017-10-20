class Action {
	constructor(action, requestHeaders, now) {
		this.action = {
			...action,
			userAgent: requestHeaders['user-agent'],
			ip: requestHeaders['x-forwarded-for'],
			time: now + action.time,
		};
	}

	getAction() {
		return this.action;
	}

}

export default Action;