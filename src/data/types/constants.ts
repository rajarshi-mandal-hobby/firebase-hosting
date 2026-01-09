export const ICON_SIZE = 16 as const;

export const ACTION_BUTTON_SIZE = 32 as const;
export const ACTION_ICON_SIZE = ACTION_BUTTON_SIZE / 2;

export const PATHS = {
	HOME: { name: "Home", path: "/" },
	ADD_MEMBER: { name: "Add Member", path: "/add-member/" },
	GENERATE_BILLS: { name: "Generate Bills", path: "/generate-bills/" },
	DEFAULT_RENTS: { name: "Default Rents", path: "/default-rents/" }
} as const;

export const DEFAULTS = {
	VALUES_DOC: "values",
	COL: "defaults"
} as const;

export const ELECTRICITY = {
	COL: "electric-bills"
} as const;

export const MEMBERS = {
	COL: "members"
} as const;

export const RENT_HISTORY = {
	COL: "rent-history"
} as const;
