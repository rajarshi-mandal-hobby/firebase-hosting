import { Avatar } from '@mantine/core';
import type { AvatarProps } from '@mantine/core';
import { forwardRef } from 'react';

export const SharedAvatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, size = 'md', radius = 'xl', ...props }, ref) => {
    return (
      <Avatar
        ref={ref}
        key={name}
        name={name}
        alt={name}
        src={src}
        size={size}
        radius={radius}
        color='initials'
        {...props}
      />
    );
  }
);
