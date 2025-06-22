const colors = {
	Reset: '\x1b[0m', // Resets the color
	FgCyan: '\x1b[36m',
	FgGreen: '\x1b[32m',
};

export const createLogger = (name: string, enable = true): Console => {
	return new Proxy(console, {
		get(target, prop: keyof Console) {
			if (typeof target[prop] === 'function') {
				if (!enable) {
					return () => {};
				}

				return (...args: any[]) => {
					const timestamp = new Date().toISOString();
					const formattedArgs = args
						.map((arg) => {
							if (typeof arg === 'object') {
								return JSON.stringify(arg, null, 2);
							}
							return String(arg);
						})
						.join(' ');
					(target[prop] as Function)(
						`${colors.FgCyan}[${timestamp}] [${name}]${colors.Reset}\n`,
						formattedArgs,
					);
				};
			}
			return target[prop];
		},
	});
};
