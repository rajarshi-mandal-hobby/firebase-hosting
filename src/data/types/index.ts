import type { FlatErrors } from 'valibot';
import type { BED_LABEL, FLOOR_LABEL, MEMBER_STATUS_LABEL, MEMBER_STATUS, FLOOR, BED } from './constants';

export * from './constants';
export type { ReactChildren } from './ReactChildren';
export type { DefaultRents } from './DefaultRents';
export type { Member } from './Member';
export type { Adjustment } from './Adjustment';
export type { RentHistory } from './RentHistory';
export type { Bill } from './Bill';

export type MemberStatus = keyof typeof MEMBER_STATUS;

export type MemberStatusLabel = (typeof MEMBER_STATUS_LABEL)[MemberStatus];

export type PaymentStatus = 'Due' | 'Paid' | 'Partial' | 'Overpaid';

export type FloorAndAll = keyof typeof FLOOR;

export type Floor = Exclude<FloorAndAll, 'all'>;

export type FloorLabel = (typeof FLOOR_LABEL)[FloorAndAll];

export type Bed = keyof typeof BED;

export type BedLabel = (typeof BED_LABEL)[Bed];

export type BedRents = {
    [F in Floor]: F extends 'second' ? Record<Bed, number> : Record<Exclude<Bed, 'special'>, number>;
};

type ValidationError = FlatErrors<any>;

export type SaveResult =
    | {
          success: true;
      }
    | {
          success: false;
          errors: ValidationError;
      };

export type Pathname = '/' | 'member-action' | 'generate-bills' | 'default-rents' | 'member-details' | 'signin';

export const PATHNAME = {
    home: '/',
    member_action: 'member-action',
    generate_bills: 'generate-bills',
    default_rents: 'default-rents',
    member_details: 'member-details',
    signin: 'signin'
} as const satisfies Record<string, Pathname>;

export const MemberFormActions = ['add', 'reactivate', 'edit'] as const;

export type MemberFormAction = (typeof MemberFormActions)[number];

export const MEMBER_ACTION_QUERY_ID = 'id';

export const MEMBER_ACTION_QUERY = {
    add: 'member-action?action=add',
    reactivate: (memberId: string) => `member-action?action=reactivate&${MEMBER_ACTION_QUERY_ID}=${memberId}`,
    edit: (memberId: string) => `member-action?action=edit&${MEMBER_ACTION_QUERY_ID}=${memberId}`
} as const satisfies Record<MemberFormAction, string | ((memberId: string) => string)>;
