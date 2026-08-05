import { randomId } from '@mantine/hooks';
import { useState } from 'react';

export const useRefreshKey = () => {
    const [refreshKey, setRefreshKey] = useState('');
    const updateKey = () => setRefreshKey(randomId());
    return [refreshKey, updateKey] as const;
};
