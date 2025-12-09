import { Stack, Text, Title, type TitleOrder, type TextProps } from '@mantine/core';

type NothingToShowProps = {
  message?: string;
} & TextProps;

export const NothingToShow = ({ size = 'sm', c = 'gray.7', message, ...props }: NothingToShowProps) => {
  let titleOrder: TitleOrder = 4;

  switch (size) {
    case 'xs':
      titleOrder = 5;
      break;
    case 'md':
      titleOrder = 3;
      break;
    case 'lg':
      titleOrder = 2;
      break;
    case 'xl':
      titleOrder = 1;
      break;
    default:
      titleOrder = 4;
  }

  return (
    <Stack align="center" justify="center" my="xl" gap="xs">
      <Title order={titleOrder} c={c}>
        {'（︶^︶）'}
      </Title>
      <Text size={size} fw={700} c={c} {...props}>
        {message || 'What you expected is not here!'}
      </Text>
    </Stack>
  );
};
