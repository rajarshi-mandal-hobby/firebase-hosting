export const DEFAULT_SVG_SIZE = 16 as const;

export const ACTION_BUTTON_SIZE = 32 as const;
export const ACTION_ICON_SIZE = ACTION_BUTTON_SIZE / 2;

export const TRANSITION_DURATION = 150 as const;

export const NAVIGATE = {
    HOME: { name: 'Home', path: '/' },
    ADD_MEMBER: { name: 'Add Member', path: '/add-member/' },
    GENERATE_BILLS: { name: 'Generate Bills', path: '/generate-bills/' },
    DEFAULT_RENTS: { name: 'Default Rents', path: '/default-rents/' },
    EDIT_MEMBER: { name: 'Edit Member', path: '/edit-member/', action: 'edit' },
    REACTIVATE_MEMBER: { name: 'Reactivate Member', path: '/edit-member/', action: 'reactivate' },
    MEMBER_DASHBOARD: { name: 'Member Dashboard', path: '/member-dashboard/' },
} as const;

export const DEFAULT_VALUES = {
    DOC: 'default-values',
    COL: 'config',
} as const;

export const BILLS = {
    COL: 'bills',
} as const;

export const MEMBERS = {
    COL: 'members',
} as const;

export const RENT_HISTORY = {
    COL: 'rent-history',
} as const;

export const ALT_TEXT = '¯\\(°_o)/¯' as const;

export const ERROR_CAUSE = {
    DATA_MISSING: 'data-missing',
    MAX_RETRY: 'max-retry',
    INVALID_DATA: 'invalid-data',
} as const;

export const TABLE_HEADER_WIDTH = 180 as const;

export const MEMBER_STATUS = {
    active: 'active',
    inactive: 'inactive',
    all: 'all',
} as const;

export const FLOOR = {
    second: 'second',
    third: 'third',
    all: 'all',
} as const;

export const BED = {
    single: 'single',
    double: 'double',
    special: 'special',
} as const;

export const MEMBER_STATUS_LABEL = {
    [MEMBER_STATUS.active]: 'Active',
    [MEMBER_STATUS.inactive]: 'Inactive',
    [MEMBER_STATUS.all]: 'All',
} as const;

export const FLOOR_LABEL = {
    [FLOOR.second]: '2nd',
    [FLOOR.third]: '3rd',
    [FLOOR.all]: 'All',
} as const;

export const BED_LABEL = {
    [BED.single]: 'Single',
    [BED.double]: 'Double',
    [BED.special]: 'Special',
} as const;
