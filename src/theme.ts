import {
  Accordion,
  ActionIcon,
  Button,
  createTheme,
  DEFAULT_THEME,
  Loader,
  ModalOverlay,
  Notification,
  NumberInput,
  SegmentedControl,
  Select,
  TextInput,
} from '@mantine/core';
import classes from './features/member-dashboard/containers/MemberDashboard.module.css';
import { CssLoader } from './shared/custom-loader/CssLoader';

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
    NumberInput: NumberInput.extend({
      defaultProps: {
        radius: 'md',
      },
    }),
    TextInput: TextInput.extend({
      defaultProps: {
        radius: 'md',
      },
    }),
    Select: Select.extend({
      defaultProps: {
        radius: 'md',
      },
    }),
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
    Notification: Notification.extend({
      defaultProps: {
        radius: 'lg',
      },
    }),
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
    Loader: Loader.extend({
      defaultProps: {
        loaders: { ...Loader.defaultLoaders, custom: CssLoader },
        type: 'custom',
      },
    }),
  },
});
