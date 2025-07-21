import {
  Accordion,
  ActionIcon,
  Button,
  createTheme,
  DEFAULT_THEME,
  ModalOverlay,
  SegmentedControl,
} from '@mantine/core';
import classes from './features/member-dashboard/containers/MemberDashboard.module.css';

export const theme = createTheme({
  fontFamily: `Work Sans, ${DEFAULT_THEME.fontFamily}`,
  primaryColor: 'dark',
  defaultRadius: 'lg',
  fontSizes: {
    // sm: rem(15),
  },
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: 'xl',
        autoContrast: true,
        fw: 500,
      },
    }),
    ModalOverlay: ModalOverlay.extend({
      defaultProps: {
        blur: 2,
      },
    }),
    NumberInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    SegmentedControl: SegmentedControl.extend({
      defaultProps: {
        radius: 'xl',
        size: 'md',
        styles: {
          innerLabel: {
            fontSize: 'var(--mantine-font-size-sm, rem(14))',
          },
        },
      },
    }),
    Notification: {
      defaultProps: {
        radius: 'lg',
      },
    },
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        variant: 'outline',
        radius: 'xl',
        size: 'md',
      },
    }),
    Accordion: Accordion.extend({
      defaultProps: {
        variant: 'contained',
        radius: 'lg',
        chevronSize: 24,
        classNames: {
          item: classes.accordionItem,
          control: classes.accordionControl,
          chevron: classes.accordionChevron,
        },
      },
    }),
  },
});
