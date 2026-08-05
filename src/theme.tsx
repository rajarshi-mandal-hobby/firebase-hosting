import {
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
    defaultVariantColorsResolver,
    parseThemeColor,
    type VariantColorsResolver,
    Checkbox,
    alpha,
    Badge,
    List,
    CheckboxIndicator
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import stylesDivider from './css-modules/Divider.module.css';
import badgeStyles from './css-modules/CustomBadge.module.css';
import { TRANSITION_DURATION } from './data/types';
import { IconCheck } from './shared/icons';

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

const variantColorResolver: VariantColorsResolver = (input) => {
    const defaultResolvedColors = defaultVariantColorsResolver(input);
    const parsedColor = parseThemeColor({
        color: input.color || input.theme.primaryColor,
        theme: input.theme
    });

    // Completely override variant
    if (input.variant === 'my-light') {
        return {
            ...defaultResolvedColors,
            background: alpha(parsedColor.value, 0.1),
            hover: alpha(parsedColor.value, 0.15),
            color: parsedColor.value
        };
    }

    return defaultResolvedColors;
};

export const theme = createTheme({
    fontFamily: `"Google Sans Flex", ${DEFAULT_THEME.fontFamily}`,
    primaryColor: 'dark',
    autoContrast: true,
    variantColorResolver,
    defaultGradient: {
        from: 'gray.4',
        to: 'gray.1',
        deg: 45
    },
    defaultRadius: 'lg',
    colors: {
        red,
        dark
    },
    headings: {
        sizes: {
            h1: { fontSize: rem(24) },
            h2: { fontSize: rem(22) },
            h3: { fontSize: rem(20) },
            h4: { fontSize: rem(18) },
            h5: { fontSize: rem(16) },
            h6: { fontSize: rem(14) }
        }
    },
    components: {
        // Divider
        Divider: Divider.extend({
            defaultProps: {
                labelPosition: 'center'
            },
            classNames: stylesDivider
        }),
        // Switch
        Switch: Switch.extend({
            styles: {
                label: {
                    fontWeight: DEFAULT_THEME.fontWeights.medium
                }
            }
        }),
        // Select
        Select: Select.extend({
            defaultProps: {
                radius: 'md',
                withAlignedLabels: true,
                comboboxProps: {
                    shadow: 'md',
                    transitionProps: {
                        transition: 'fade-down',
                        duration: TRANSITION_DURATION
                    }
                }
            }
        }),
        // Alert
        Alert: Alert.extend({
            styles: (theme) => ({
                icon: {
                    marginInlineEnd: theme.spacing.xs
                },
                title: {
                    fontWeight: theme.fontWeights.bold,
                    fontSize: theme.fontSizes.md
                },
                closeButton: {
                    marginInlineStart: theme.spacing.xs
                }
            })
        }),
        // Text
        Text: Text.extend({
            defaultProps: {
                size: 'sm'
            }
        }),
        Title: Title.extend({
            styles: {
                root: {
                    textWrapStyle: 'balance'
                }
            }
        }),
        // Button
        Button: Button.extend({
            defaultProps: {
                radius: 'xl',
                autoContrast: true
            }
        }),
        // Checkbox
        Checkbox: Checkbox.extend({
            defaultProps: {
                radius: 'xl'
            },
            styles: {
                label: {
                    fontWeight: DEFAULT_THEME.fontWeights.medium,
                    userSelect: 'none'
                },
                icon: {
                    width: '12px',
                    height: '12px'
                }
            }
        }),
        // Loading Overlay
        LoadingOverlay: LoadingOverlay.extend({
            defaultProps: {
                overlayProps: {
                    blur: 2,
                    backgroundOpacity: 0.2
                }
            },
            styles: {
                root: {
                    margin: rem(-2)
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
                closeButtonProps: {
                    bg: 'var(--mantine-color-disabled)',
                    iconSize: 16
                },
                styles: (theme) => ({
                    title: {
                        fontWeight: theme.fontWeights.bold,
                        fontSize: theme.headings.sizes.h5.fontSize
                    },
                    header: {
                        borderBlockEnd: `${rem(1)} solid var(--paper-border-color)`,
                        marginBlockEnd: theme.spacing.md
                    }
                })
            }
        }),
        // Inputs
        Input: Input.extend({
            defaultProps: {
                radius: 'md',
                rightSectionWidth: 34,
                leftSectionWidth: 34,
                styles: (theme) => ({
                    section: {
                        fontSize: `var(--input-fz, ${theme.fontSizes.md})`,
                        userSelect: 'none',
                        lineHeight: 1
                    },
                    input: {
                        fontFeatureSettings: "'tnum', 'zero'"
                    }
                })
            }
        }),
        NumberInput: NumberInput.extend({
            defaultProps: {
                radius: 'md',
                size: 'sm'
            }
        }),
        TextInput: TextInput.extend({
            defaultProps: {
                radius: 'md'
            }
        }),
        MultiSelect: MultiSelect.extend({
            defaultProps: {
                radius: 'md',
                withAlignedLabels: true,
                comboboxProps: {
                    shadow: 'md',
                    transitionProps: {
                        transition: 'fade-up',
                        duration: TRANSITION_DURATION
                    },
                    position: 'top'
                },
                maxDropdownHeight: '200px'
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
                shadow: 'md',
                withArrow: true,
                arrowPosition: 'center',
                position: 'left-start',
                transitionProps: {
                    transition: 'pop-top-right',
                    duration: TRANSITION_DURATION
                }
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
                withBorder: true,
                loaderProps: {
                    size: 24
                }
            },
            styles: (theme) => {
                return {
                    root: {
                        border: `1px solid ${theme.colors.gray[2]}`,
                        minHeight: 50,
                        backgroundColor: theme.colors.gray[0],
                        paddingBlock: theme.spacing.xs,
                        paddingInline: theme.spacing.md,
                        maxHeight: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    },
                    title: {
                        fontSize: theme.fontSizes.sm,
                        fontWeight: 700
                    },
                    icon: {
                        height: 20,
                        width: 20
                    },
                    body: {
                        margin: 0
                    }
                };
            }
        }),
        ActionIcon: ActionIcon.extend({
            defaultProps: {
                radius: 'xl',
                size: rem(32)
            }
        }),
        // Popover
        Popover: Popover.extend({
            defaultProps: {
                shadow: 'var(--mantine-shadow-md)',
                transitionProps: {
                    transition: 'pop-top-right',
                    duration: TRANSITION_DURATION
                },
                withArrow: true,
                arrowPosition: 'center'
            }
        }),
        Badge: Badge.extend({
            classNames: badgeStyles
        }),
        List: List.extend({
            defaultProps: {
                size: 'sm'
            }
        })
    }
});
