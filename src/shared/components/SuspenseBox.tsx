import { Suspense, type SuspenseProps } from 'react';
import { LoadingBox } from './LoadingBox';

export const SuspenseBox = ({ children, fallback }: SuspenseProps) => (
    <Suspense fallback={fallback || <LoadingBox />}>{children}</Suspense>
);
