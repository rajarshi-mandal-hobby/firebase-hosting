import { Avatar } from '@mantine/core';
import type { AvatarProps } from '@mantine/core';

export const SharedAvatar = ({ ...props }: AvatarProps) => {
  return (
    <Avatar
      key={props.name}
      name={props.name}
      alt={props.name}
      src={props.src || null}
      size={props.size || 'md'} // Default to 'md' if size not provided
      radius={props.radius || 'xl'} // Default to 'xl' radius
      color={'initials'}
      {...props}
    />
  );
};
