import {
  Accordion,
  ActionIcon,
  Alert,
  Button,
  createTheme,
  DEFAULT_THEME,
  Divider,
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
  Text,
  type MantineColorsTuple,
  Title,
  Collapse,
  defaultVariantColorsResolver,
  parseThemeColor,
  type VariantColorsResolver,
  Checkbox,
  alpha,
} from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import stylesDivider from "./css-modules/Divider.module.css";
import { TRANSITION_DURATION } from "./data/types";

const red: MantineColorsTuple = [
  "#ffe8e9",
  "#ffd1d1",
  "#fba0a0",
  "#f76d6d",
  "#f44141",
  "#f22625",
  "#f21616",
  "#d8070b",
  "#c10007",
  "#a90003",
];

const dark: MantineColorsTuple = [
  "#ced4da",
  "#adb5bd",
  "#868e96",
  "#495057",
  "#424242",
  "#3b3b3b",
  "#2e2e2e",
  "#242424",
  "#1f1f1f",
  "#141414",
];

const lime: MantineColorsTuple = [
  "#e9fde9",
  "#d6f7d6",
  "#aeecae",
  "#83e183",
  "#5fd75e",
  "#47d246",
  "#32cd32",
  "#2ab72b",
  "#20a223",
  "#0c8c18",
];

const green: MantineColorsTuple = [
  "#ebfbeb",
  "#dbf3db",
  "#afe1af",
  "#90d58f",
  "#6fc86e",
  "#5ac059",
  "#4ebc4d",
  "#3ea53e",
  "#349335",
  "#267f29",
];

const variantColorResolver: VariantColorsResolver = (input) => {
  const defaultResolvedColors = defaultVariantColorsResolver(input);
  const parsedColor = parseThemeColor({
    color: input.color || input.theme.primaryColor,
    theme: input.theme,
  });

  // Completely override variant
  if (input.variant === "light") {
    return {
      ...defaultResolvedColors,
      background: alpha(parsedColor.value, 0.1),
      color: parsedColor.value,
    };
  }

  return defaultResolvedColors;
};

export const theme = createTheme({
  fontFamily: `Inter, ${DEFAULT_THEME.fontFamily}`,
  primaryColor: "dark",
  autoContrast: true,
  variantColorResolver,
  defaultGradient: {
    from: "violet.5",
    to: "violet.7",
    deg: 90,
  },
  defaultRadius: "lg",
  colors: {
    red,
    dark,
    lime,
    green,
  },
  headings: {
    sizes: {
      h1: { fontSize: rem(24) },
      h2: { fontSize: rem(22) },
      h3: { fontSize: rem(20) },
      h4: { fontSize: rem(18) },
      h5: { fontSize: rem(16) },
      h6: { fontSize: rem(14) },
    },
  },
  components: {
    // Collapse
    Collapse: Collapse.extend({
      defaultProps: {
        transitionDuration: TRANSITION_DURATION,
        transitionTimingFunction: "ease-in-out",
      },
    }),
    // Divider
    Divider: Divider.extend({
      defaultProps: {
        labelPosition: "left",
      },
      classNames: stylesDivider,
    }),
    // Switch
    Switch: Switch.extend({
      styles: {
        label: {
          fontWeight: 500,
        },
      },
    }),
    // Select
    Select: Select.extend({
      defaultProps: {
        radius: "md",
        withAlignedLabels: true,
        comboboxProps: {
          shadow: "md",
          transitionProps: {
            transition: "fade-down",
            duration: TRANSITION_DURATION,
          },
        },
      },
    }),
    // Alert
    Alert: Alert.extend({
      styles: (_theme, _props) => {
        return {
          icon: {
            marginRight: rem(4),
          },
          title: {
            fontWeight: 700,
            fontSize: "var(--mantine-font-size-md)",
          },
        };
      },
    }),
    // Text
    Text: Text.extend({
      defaultProps: {
        size: "sm",
      },
      styles: {
        root: {
          textWrapStyle: "pretty",
        },
      },
    }),
    Title: Title.extend({
      styles: {
        root: {
          textWrapStyle: "balance",
        },
      },
    }),
    // Button
    Button: Button.extend({
      defaultProps: {
        radius: "xl",
        autoContrast: true,
        fw: 500,
      },
    }),
    // Checkbox
    Checkbox: Checkbox.extend({
      defaultProps: {
        radius: "xl",
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
        size: "sm",
        centered: true,
        overlayProps: {
          blur: 3,
        },
        transitionProps: { transition: "pop", timingFunction: "ease-out", duration: 150 },
        styles: {
          title: {
            fontWeight: 700,
            fontSize: "var(--mantine-h5-font-size)",
          },
        },
      },
    }),
    // Inputs
    Input: Input.extend({
      defaultProps: {
        radius: "md",
      },
    }),
    NumberInput: NumberInput.extend({
      defaultProps: {
        radius: "md",
        size: "sm",
      },
    }),
    TextInput: TextInput.extend({
      defaultProps: {
        radius: "md",
      },
    }),
    MultiSelect: MultiSelect.extend({
      defaultProps: {
        radius: "md",
        withAlignedLabels: true,
        comboboxProps: {
          shadow: "md",
          transitionProps: {
            transition: "fade-up",
            duration: TRANSITION_DURATION,
          },
          position: "top",
        },
        maxDropdownHeight: "200px",
      },
    }),
    Textarea: Textarea.extend({
      defaultProps: {
        radius: "md",
        autosize: true,
        minRows: 3,
      },
    }),
    MonthPickerInput: MonthPickerInput.extend({
      defaultProps: {
        radius: "xl",
      },
    }),

    // Segmented Control
    SegmentedControl: SegmentedControl.extend({
      defaultProps: {
        radius: "xl",
        size: "md",
        fullWidth: true,
        styles: {
          innerLabel: {
            fontWeight: 700,
            fontSize: "var(--mantine-font-size-sm, rem(14))",
          },
        },
      },
    }),
    // Menu
    Menu: Menu.extend({
      defaultProps: {
        width: 200,

        shadow: "md",
        withArrow: true,
        arrowPosition: "center",
        position: "left-start",
        transitionProps: {
          transition: "pop-top-right",
          duration: TRANSITION_DURATION,
        },
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
        withBorder: true,
      },
      styles: (theme) => {
        return {
          root: {
            border: `1px solid ${theme.colors.gray[2]}`,
            width: "max-content",
            minHeight: rem(50),
          },
          title: {
            fontSize: "var(--mantine-font-size-sm)",
            fontWeight: 700,
          },
          icon: {
            height: rem(18),
            width: rem(18),
            marginInlineStart: rem(-8),
          },
        };
      },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        radius: "xl",
        size: rem(32),
      },
    }),
    Accordion: Accordion.extend({
      defaultProps: {
        radius: "lg",
        chevronSize: 24,
      },
    }),
    // Popover
    Popover: Popover.extend({
      defaultProps: {
        shadow: "var(--mantine-shadow-md)",
        transitionProps: {
          transition: "pop-top-right",
          duration: TRANSITION_DURATION,
        },
        withArrow: true,
        arrowPosition: "center",
      },
    }),
  },
});
