import { Suspense } from 'react';
import { LoadingBox } from './LoadingBox';

export const SuspenseBox = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<LoadingBox />}>{children}</Suspense>
);
