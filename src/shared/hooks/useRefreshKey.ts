import { useState } from 'react';

export const useRefreshKey = () => {
    const [refreshKey, setRefreshKey] = useState<number>(0);
    return [refreshKey, () => setRefreshKey((prev) => prev + 1)] as const;
};
