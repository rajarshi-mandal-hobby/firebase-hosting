import { forwardRef } from 'react';
import { type BoxComponentProps, type MantineLoaderComponent, Box } from '@mantine/core';
import cx from 'clsx';
import classes from './CssLoader.module.css';

// TODO: Once Mantine updates to React 19, replace forwardRef with direct ref prop
// React 19 allows: function Component({ ref, ...props }) { ... }
// But Mantine's MantineLoaderComponent type still expects ForwardRefExoticComponent

export const CssLoader: MantineLoaderComponent = forwardRef<HTMLSpanElement, BoxComponentProps>(
  ({ className, ...props }, ref) => {
    return <Box component='span' className={cx(classes.loader, className)} {...props} ref={ref} />;
  }
);

CssLoader.displayName = 'CssLoader';
