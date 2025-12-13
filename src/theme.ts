import {
  Accordion,
  ActionIcon,
  Alert,
  Button,
  createTheme,
  DEFAULT_THEME,
  Input,
  LoadingOverlay,
  Menu,
  MenuItem,
  Modal,
  MultiSelect,
  Notification,
  NumberInput,
  Popover,
  rem,
  SegmentedControl,
  Select,
  Switch,
  Textarea,
  TextInput,
  type MantineColorsTuple
} from '@mantine/core';
import classesAccordion from './css-modules/Accordion.module.css';
import { MonthPickerInput } from '@mantine/dates';

const red: MantineColorsTuple = [
  '#ffe8e9',
  '#ffd1d1',
  '#fba0a0',
  '#f76d6d',
  '#f44141',
  '#f22625',
  '#f21616',
  '#d8070b',
  '#c10007',
  '#a90003'
];

const dark: MantineColorsTuple = [
  '#ced4da',
  '#adb5bd',
  '#868e96',
  '#495057',
  '#424242',
  '#3b3b3b',
  '#2e2e2e',
  '#242424',
  '#1f1f1f',
  '#141414'
];
export const theme = createTheme({
  fontFamily: `Noto Sans, ${DEFAULT_THEME.fontFamily}`,
  primaryColor: 'dark',
  defaultRadius: 'lg',
  colors: {
    red,
    dark
  },
  fontSizes: {
    xs: rem(12),
    sm: rem(14),
    md: rem(16),
    lg: rem(18),
    xl: rem(20)
  },
  headings: {
    sizes: {
      h1: {
        fontSize: rem(32)
      },
      h2: {
        fontSize: rem(28)
      },
      h3: {
        fontSize: rem(24)
      },
      h4: {
        fontSize: rem(20)
      },
      h5: {
        fontSize: rem(16)
      },
      h6: {
        fontSize: rem(12)
      }
    }
  },
  components: {
    // Switch
    Switch: Switch.extend({
      styles: {
        label: {
          fontWeight: 500
        }
      }
    }),
    // Select
    Select: Select.extend({
      defaultProps: {
        radius: 'md',
        rightSectionWidth: rem(30),
        withAlignedLabels: true,
        comboboxProps: { shadow: 'md', transitionProps: { transition: 'fade-down', duration: 150 } }
      }
    }),
    // Alert
    Alert: Alert.extend({
      styles: {
        icon: {
          marginRight: rem(4)
        }
      }
    }),
    // Text
    Text: {
      defaultProps: {
        size: 'sm'
      }
    },
    // Button
    Button: Button.extend({
      defaultProps: {
        radius: 'xl',
        autoContrast: true
      }
    }),
    // Loading Overlay
    LoadingOverlay: LoadingOverlay.extend({
      defaultProps: {
        overlayProps: {
          blur: 3
        }
      }
    }),
    // Modal
    Modal: Modal.extend({
      defaultProps: {
        size: 'sm',
        centered: true,
        overlayProps: {
          blur: 3
        },
        transitionProps: { transition: 'pop', timingFunction: 'ease-out', duration: 150 },
        styles: {
          title: {
            fontWeight: 700
          }
        },
        fs: 'sm'
      }
    }),
    // Inputs
    Input: Input.extend({
      defaultProps: {
        radius: 'md'
      }
    }),
    NumberInput: NumberInput.extend({
      defaultProps: {
        radius: 'md'
      }
    }),
    TextInput: TextInput.extend({
      defaultProps: {
        radius: 'md'
      }
    }),
    MultiSelect: MultiSelect.extend({
      defaultProps: {
        radius: 'md'
      }
    }),
    Textarea: Textarea.extend({
      defaultProps: {
        radius: 'md',
        autosize: true,
        minRows: 3
      }
    }),
    MonthPickerInput: MonthPickerInput.extend({
      defaultProps: {
        radius: 'xl'
      }
    }),

    // Segmented Control
    SegmentedControl: SegmentedControl.extend({
      defaultProps: {
        radius: 'xl',
        size: 'md',
        fullWidth: true,
        styles: {
          innerLabel: {
            fontWeight: 700,
            fontSize: 'var(--mantine-font-size-sm, rem(14))'
          }
        }
      }
    }),
    // Menu
    Menu: Menu.extend({
      defaultProps: {
        width: 200,
        radius: 'lg',
        shadow: 'md',
        withArrow: true,
        arrowPosition: 'center',
        position: 'left-start',
        transitionProps: { transition: 'pop-top-right', duration: 150 }
      }
    }),
    MenuItem: MenuItem.extend({
      defaultProps: {
        styles: {
          itemLabel: {
            paddingTop: rem(2.5),
            paddingBottom: rem(2.5)
          }
        }
      }
    }),
    // Notification
    Notification: Notification.extend({
      defaultProps: {
        radius: 'xl',
        withBorder: true
      },
      styles: {
        root: {
          boxShadow: 'var(--mantine-shadow-sm)'
        },
        title: {
          fontSize: 'var(--mantine-font-size-sm)',
          fontWeight: 700
        },
        icon: {
          width: '16px',
          height: '16px'
        }
      }
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        radius: 'xl',
        size: rem(32)
      }
    }),
    Accordion: Accordion.extend({
      defaultProps: {
        variant: 'contained',
        radius: 'lg',
        chevronSize: 24,
        classNames: {
          item: classesAccordion['accordion-item'],
          control: classesAccordion['accordion-control'],
          chevron: classesAccordion['accordion-chevron'],
          label: classesAccordion['accordion-label']
        }
      }
    }),
    // Popover
    Popover: Popover.extend({
      defaultProps: {
        shadow: 'var(--mantine-shadow-md)',
        transitionProps: { transition: 'pop-top-right', duration: 150 },
        withArrow: true,
        arrowPosition: 'center'
      }
    })
  }
});
