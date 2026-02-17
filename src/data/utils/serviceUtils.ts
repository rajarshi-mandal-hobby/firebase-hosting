// Network simulation helpers
export const simulateNetworkDelay = (delay = 500) => {
    return new Promise((resolve) => setTimeout(resolve, delay));
};

interface SimulateRandomErrorOptions {
    errorRate?: number;
    forceError?: boolean;
}

export const simulateRandomError = ({ errorRate = 0.2, forceError = false }: SimulateRandomErrorOptions = {}): void => {
    if (Math.random() < errorRate || forceError) {
        throw new Error('Simulated network error - please retry');
    }
};
