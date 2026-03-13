import { useState, useEffectEvent, useEffect, useRef } from 'react';

type ActivityName = 'defualt-rents-activity' | 'rent-activity' | 'member-management-activity' | 'not_mounted';
export const useActivityMountedKey = (activityName: ActivityName) => {
    const [key, setKey] = useState('not_mounted');
    const isMountedRef = useRef(false);

    const evt = useEffectEvent(() => {
        const mounted = isMountedRef.current ? '_mounted' : '_unmounted';
        const newKey = activityName + mounted;
        if (newKey === key) return
        setKey(newKey);
    });

    useEffect(() => {
        isMountedRef.current = true;
        evt();
        return () => {
            isMountedRef.current = false;
            evt();
        };
    }, []);

    return key;
};
