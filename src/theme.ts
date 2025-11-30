import {
  Accordion,
  ActionIcon,
  Button,
  createTheme,
  DEFAULT_THEME,
  Input,
  Loader,
  LoadingOverlay,
  Menu,
  MenuItem,
  Modal,
  MultiSelect,
  Notification,
  NumberInput,
  rem,
  SegmentedControl,
  Select,
  Textarea,
  TextInput,
} from '@mantine/core';
import classes from './features/member-dashboard/containers/MemberDashboard.module.css';
import { CssLoader } from './shared/custom-loader/CssLoader';
import { MonthPickerInput } from '@mantine/dates';

export const theme = createTheme({
  fontFamily: `Work Sans, ${DEFAULT_THEME.fontFamily}`,
  primaryColor: 'dark',
  defaultRadius: 'lg',
  fontSizes: {
    // sm: rem(15),
  },
  components: {
    // Text
    Text: {
      defaultProps: {
        size: 'sm',
      },
    },
    // Button
    Button: Button.extend({
      defaultProps: {
        radius: 'xl',
        autoContrast: true,
        fw: 500,
      },
    }),
    // Loading Overlay
    LoadingOverlay: LoadingOverlay.extend({
      defaultProps: {
        overlayProps: {
          blur: 3,
        },
      },
    }),
    // Modal
    Modal: Modal.extend({
      defaultProps: {
        size: 'md',
        centered: true,
        overlayProps: {
          blur: 3,
        },
        transitionProps: { transition: 'scale', timingFunction: 'ease-in-out' },
        styles: {
          title: {
            fontWeight: 700,
          },
        },
        fs: 'sm',
      },
    }),
    // Inputs
    Input: Input.extend({
      defaultProps: {
        radius: 'md',
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
    MultiSelect: MultiSelect.extend({
      defaultProps: {
        radius: 'md',
      },
    }),
    Textarea: Textarea.extend({
      defaultProps: {
        radius: 'md',
        autosize: true,
        minRows: 3,
      },
    }),
    MonthPickerInput: MonthPickerInput.extend({
      defaultProps: {
        radius: 'xl',
      },
    }),
    
    // Segmented Control
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
    // Menu
    Menu: Menu.extend({
      defaultProps: {
        width: 220,
        radius: 'lg',
        shadow: 'lg',
        withArrow: true,
        arrowPosition: 'center',
      },
    }),
    MenuItem: MenuItem.extend({
      defaultProps: {
        styles: {
          itemLabel: {
            paddingTop: rem(2.5),
            paddingBottom: rem(2.5),
          },
        },
      },
    }),
    // Notification
    Notification: Notification.extend({
      defaultProps: {
        radius: 'lg',
      },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        radius: 'xl',
        size: rem(32),
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
          label: classes.accordionLabel,
        },
      },
    }),
    //
    Loader: Loader.extend({
      defaultProps: {
        loaders: { ...Loader.defaultLoaders, custom: CssLoader },
        type: 'custom',
      },
    }),
  },
});
