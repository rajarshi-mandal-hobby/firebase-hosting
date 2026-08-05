import type { ReactNode } from 'react';
import { type Pathname } from '../../../data/types';
import { IconPersonAdd, IconReceipt, IconDataObject } from '../../../shared/icons';

export interface TitlesMap {
    title: string;
    Icon?: ReactNode;
}

export const TITLES = {
    '/': { title: 'Rajarshi Mess' },
    'member-action': { title: 'Add Member', Icon: <IconPersonAdd /> },
    'generate-bills': { title: 'Generate Bills', Icon: <IconReceipt /> },
    'default-rents': { title: 'Default Rents', Icon: <IconDataObject /> },
    'member-details': { title: 'Member Details' },
    signin: { title: 'Sign In' }
} as const satisfies Record<Pathname, TitlesMap>;
