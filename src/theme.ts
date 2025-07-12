import { Accordion, ActionIcon, Button, createTheme, DEFAULT_THEME, Modal, ModalHeader, rem, SegmentedControl } from '@mantine/core';
import classes from './pages/MemberDashboard.module.css';

export const theme = createTheme({
  fontFamily: `Work Sans, ${DEFAULT_THEME.fontFamily}`,
  primaryColor: 'dark',
  defaultRadius: 'lg',
  fontSizes: {

    // sm: rem(15),
  },
  // colors: {
  //   // High-contrast black theme colors
  //   dark: [
  //     '#f2f2f2',
  //     '#d9d9d9',
  //     '#bfbfbf',
  //     '#a6a6a6',
  //     '#8c8c8c',
  //     '#737373',
  //     '#595959',
  //     '#404040',
  //     '#262626',
  //     '#0d0d0d',
  //   ],
  //   // Status colors optimized for high contrast
  //   success: [
  //     '#f8fff8',
  //     '#e8f5e8',
  //     '#d3eddd',
  //     '#b2e5c2',
  //     '#82d49c',
  //     '#51c473',
  //     '#40c057',
  //     '#37b24d',
  //     '#2f9e44',
  //     '#1b5e20',
  //   ],
  //   warning: [
  //     '#fffaf0',
  //     '#fff3cd',
  //     '#ffeaa7',
  //     '#fdcb6e',
  //     '#f39c12',
  //     '#e67e22',
  //     '#d35400',
  //     '#c0392b',
  //     '#a93226',
  //     '#922b21',
  //   ],
  //   error: [
  //     '#fff5f5',
  //     '#fed7d7',
  //     '#feb2b2',
  //     '#fc8181',
  //     '#f56565',
  //     '#e53e3e',
  //     '#c53030',
  //     '#9b2c2c',
  //     '#822727',
  //     '#63171b',
  //   ],
  //   // Rent status colors with high contrast
  //   due: ['#fff5f5', '#fed7d7', '#feb2b2', '#fc8181', '#f56565', '#e53e3e', '#c53030', '#9b2c2c', '#822727', '#63171b'],
  //   paid: [
  //     '#f8fff8',
  //     '#e8f5e8',
  //     '#d3eddd',
  //     '#b2e5c2',
  //     '#82d49c',
  //     '#51c473',
  //     '#40c057',
  //     '#37b24d',
  //     '#2f9e44',
  //     '#1b5e20',
  //   ],
  //   partial: [
  //     '#fffaf0',
  //     '#fff3cd',
  //     '#ffeaa7',
  //     '#fdcb6e',
  //     '#f39c12',
  //     '#e67e22',
  //     '#d35400',
  //     '#c0392b',
  //     '#a93226',
  //     '#922b21',
  //   ],
  // },
  components: {
    
    Button: Button.extend({
      defaultProps: {
        radius: 'xl',
        // color: 'dark.8',
        autoContrast: true,
        size: 'sm',
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        radius: 'lg',
      },
    }),
    ModalHeader: ModalHeader.extend({
      defaultProps: {
        fz: 'lg',
      },
    }),
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
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
