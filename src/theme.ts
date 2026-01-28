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
	rgba
} from "@mantine/core";
import classesAccordion from "./css-modules/Accordion.module.css";
import { MonthPickerInput } from "@mantine/dates";
import stylesDivider from "./css-modules/Divider.module.css";

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
	"#a90003"
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
	"#141414"
];
export const theme = createTheme({
	fontFamily: `Inter, ${DEFAULT_THEME.fontFamily}`,
	primaryColor: "dark",
	primaryShade: {
		light: 6,
		dark: 9
	},
	autoContrast: true,
	defaultGradient: {
		from: "violet.5",
		to: "violet.7",
		deg: 90
	},
	defaultRadius: "lg",
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
		// Collapse
		Collapse: Collapse.extend({
			defaultProps: {
				transitionDuration: 150,
				transitionTimingFunction: "ease-in-out"
			}
		}),
		// Divider
		Divider: Divider.extend({
			defaultProps: {
				labelPosition: "left"
			},
			classNames: stylesDivider
		}),
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
				radius: "md",
				withAlignedLabels: true,
				comboboxProps: { shadow: "md", transitionProps: { transition: "fade-down", duration: 150 } }
			}
		}),
		// Alert
		Alert: Alert.extend({
			styles: (theme, props) => {
				return {
					icon: {
						marginRight: rem(4)
					},
					title: {
						fontWeight: 700,
						fontSize: "var(--mantine-font-size-md)"
					}
				};
			}
		}),
		// Text
		Text: Text.extend({
			defaultProps: {
				size: "sm"
			},
			styles: {
				root: {
					textWrapStyle: "pretty"
				}
			}
		}),
		Title: Title.extend({
			styles: {
				root: {
					textWrapStyle: "balance"
				}
			}
		}),
		// Button
		Button: Button.extend({
			defaultProps: {
				radius: "xl",
				autoContrast: true,
				fw: 500
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
				size: "sm",
				centered: true,
				overlayProps: {
					blur: 3
				},
				transitionProps: { transition: "pop", timingFunction: "ease-out", duration: 150 },
				styles: {
					title: {
						fontWeight: 700,
						fontSize: "var(--mantine-h5-font-size)"
					}
				}
			}
		}),
		// Inputs
		Input: Input.extend({
			defaultProps: {
				radius: "md"
			}
		}),
		NumberInput: NumberInput.extend({
			defaultProps: {
				radius: "md",
				size: "sm"
			}
		}),
		TextInput: TextInput.extend({
			defaultProps: {
				radius: "md"
			}
		}),
		MultiSelect: MultiSelect.extend({
			defaultProps: {
				radius: "md",
				withAlignedLabels: true,
				comboboxProps: {
					shadow: "md",
					transitionProps: {
						transition: "fade-up",
						duration: 150
					},
					position: "top"
				},
				maxDropdownHeight: "200px"
			}
		}),
		Textarea: Textarea.extend({
			defaultProps: {
				radius: "md",
				autosize: true,
				minRows: 3
			}
		}),
		MonthPickerInput: MonthPickerInput.extend({
			defaultProps: {
				radius: "xl"
			}
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
						fontSize: "var(--mantine-font-size-sm, rem(14))"
					}
				}
			}
		}),
		// Menu
		Menu: Menu.extend({
			defaultProps: {
				width: 200,
				radius: "lg",
				shadow: "md",
				withArrow: true,
				arrowPosition: "center",
				position: "left-start",
				transitionProps: {
					transition: "pop-top-right",
					duration: 150
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
				radius: "xl",
				withBorder: true
			},
			styles: {
				root: {
					boxShadow: "var(--mantine-shadow-xs)",
					border: "1px solid var(--mantine-color-gray-0)",
					padding: "var(--mantine-spacing-sm)"
				},
				title: {
					fontSize: "var(--mantine-font-size-sm)",
					fontWeight: 700
				}
			}
		}),
		ActionIcon: ActionIcon.extend({
			defaultProps: {
				radius: "xl",
				size: rem(32)
			}
		}),
		Accordion: Accordion.extend({
			defaultProps: {
				variant: "contained",
				radius: "lg",
				chevronSize: 24,
				classNames: {
					item: classesAccordion["accordion-item"],
					control: classesAccordion["accordion-control"],
					chevron: classesAccordion["accordion-chevron"],
					label: classesAccordion["accordion-label"]
				}
			}
		}),
		// Popover
		Popover: Popover.extend({
			defaultProps: {
				shadow: "var(--mantine-shadow-md)",
				transitionProps: {
					transition: "pop-top-right",
					duration: 150
				},
				withArrow: true,
				arrowPosition: "center"
			}
		})
	}
});
