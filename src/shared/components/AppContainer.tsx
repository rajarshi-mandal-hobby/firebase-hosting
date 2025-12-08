import { Container } from '@mantine/core';
import type { ContainerProps } from '@mantine/core';
import type { ReactNode } from 'react';

interface AppContainerProps extends Omit<ContainerProps, 'children'> {
  /** Container content */
  children: ReactNode;
}

/**
 * Main App Container Component
 *
 * Provides consistent container sizing across the application:
 * - Large screens: Container size 'md' with full viewport height
 * - Small screens: Container size 'sm' with full viewport height
 * - Applies Nunito Sans font family
 * - Consistent padding and spacing
 */
export function AppContainer({ children, ...props }: AppContainerProps) {
  return (
    <Container strategy='grid' size='xs' {...props}>
      {children}
    </Container>
  );
}
