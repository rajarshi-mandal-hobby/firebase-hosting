// Network simulation helpers
export const simulateNetworkDelay = (delay = 500) => {
	return new Promise((resolve) => setTimeout(resolve, delay));
};

export const simulateRandomError = (errorRate = 0.05): void => {
	if (Math.random() < errorRate) {
		throw new Error("Simulated network error - please retry");
	}
};
