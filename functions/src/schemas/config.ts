import { Timestamp, DocumentData } from 'firebase-admin/firestore';
import { Floor, BedType } from '../types/shared';
import * as v from 'valibot';

// Configuration types
// New: explicit per-floor bed counts to avoid indexing a type as a value

export type BedRents = {
  [F in Floor]: F extends '2nd' ? BedCounts2nd : BedCounts3rd;
};

export type BedCounts2nd = {
  [B in BedType]: number;
};
export type BedCounts3rd = {
  [B in Exclude<BedType, 'Special'>]: number;
};

export interface GlobalSettings {
  // replaced invalid syntax with the explicit BedTypes mapping
  bedRents: BedRents;
  securityDeposit: number;
  wifiMonthlyCharge: number;
  upiVpa: string;
  activememberCounts: {
    total: number;
    byFloor: {
      [F in Floor]: number;
    };
    wifiOptedIn: number;
  };
  currentBillingMonth: Timestamp;
  nextBillingMonth: Timestamp;
}

export const toGlobalSettings = (data: DocumentData): GlobalSettings =>
  ({
    bedRents: {
      '2nd': {
        Bed: data.bedTypes['2nd'].Bed,
        Room: data.bedTypes['2nd'].Room,
        Special: data.bedTypes['2nd'].Special,
      },
      '3rd': {
        Bed: data.bedTypes['3rd'].Bed,
        Room: data.bedTypes['3rd'].Room,
      },
    },
    activememberCounts: {
      total: data.activememberCounts.total,
      byFloor: {
        '2nd': data.activememberCounts.byFloor['2nd'],
        '3rd': data.activememberCounts.byFloor['3rd'],
      },
      wifiOptedIn: data.activememberCounts.wifiOptedIn,
    },
    securityDeposit: data.securityDeposit,
    wifiMonthlyCharge: data.wifiMonthlyCharge,
    upiVpa: data.upiVpa,
    currentBillingMonth: data.currentBillingMonth,
    nextBillingMonth: data.nextBillingMonth,
  } satisfies GlobalSettings);

export type GlobalSettingsInput = Omit<
  GlobalSettings,
  'activememberCounts' | 'currentBillingMonth' | 'nextBillingMonth'
>;

const bedRentNumberValidation = v.pipe(
  v.number('Must be a number'),
  v.integer('Must be an integer'),
  v.minValue(1600, 'Must be at least 1600'),
  v.maxValue(9999, 'Must be at most 4 digits')
);

export const GlobalSettingsInputSchema = v.object({
  bedRents: v.object({
    '2nd': v.object({
      Bed: bedRentNumberValidation,
      Room: bedRentNumberValidation,
      Special: bedRentNumberValidation,
    }),
    '3rd': v.object({
      Bed: bedRentNumberValidation,
      Room: bedRentNumberValidation,
    }),
  }),
  securityDeposit: v.pipe(
    v.number('Must be a number'),
    v.integer('Must be an integer'),
    v.minValue(1000, 'Must be at least 1000'),
    v.maxValue(9999, 'Must be at most 4 digits')
  ),
  wifiMonthlyCharge: v.pipe(
    v.number('Must be a number'),
    v.integer('Must be an integer'),
    v.minValue(100, 'Must be at least 3 digits'),
    v.maxValue(9999, 'Must be at most 4 digits')
  ),
  upiVpa: v.pipe(
    v.string('Must be a string'),
    v.transform((s) => s.trim().toLowerCase()),
    v.regex(/^[a-z0-9_-]{3,20}@[a-z0-9]{3,10}$/, 'Must be UPI VPA format (e.g. name@bank)')
  ),
});

export const GlobalSettingsValidationResult = (requestData: any) => v.safeParse(GlobalSettingsInputSchema, requestData);


export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
