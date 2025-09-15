import { z } from 'zod';
import { ZodFourDigitPositiveNumber, ZodThreeToFourDigitsNumber, ZodUpiVpa } from './primitives';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';
import { Floor } from '../types/shared';

// Configuration types
// New: explicit per-floor bed counts to avoid indexing a type as a value

type BedTypes = {
  [F in Floor]: F extends '2nd' ? BedCounts2nd : BedCounts3rd;
};

interface BedCounts2nd {
  Bed: number;
  Room: number;
  Special: number;
}
interface BedCounts3rd {
  Bed: number;
  Room: number;
}

export interface GlobalSettings {
  // replaced invalid syntax with the explicit BedTypes mapping
  bedTypes: BedTypes;
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
  currentBillingMonth?: Timestamp;
  nextBillingMonth?: Timestamp;
}

export const toGlobalSettings = (data: DocumentData): GlobalSettings =>
  ({
    bedTypes: {
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
  } satisfies GlobalSettings);

export type GlobalSettingsInput = Omit<GlobalSettings, 'activememberCounts' | 'currentBillingMonth' | 'nextBillingMonth'>;

// Strict schema for full objects (no .optional() on fields)
export const GlobalSettingsInputSchema: z.ZodType<GlobalSettingsInput> = z.object({
  bedTypes: z.object({
    '2nd': z.object({
      Bed: ZodFourDigitPositiveNumber,
      Room: ZodFourDigitPositiveNumber,
      Special: ZodFourDigitPositiveNumber,
    }),
    '3rd': z.object({
      Bed: ZodFourDigitPositiveNumber,
      Room: ZodFourDigitPositiveNumber,
    }),
  }),
  securityDeposit: ZodFourDigitPositiveNumber,
  wifiMonthlyCharge: ZodThreeToFourDigitsNumber,
  upiVpa: ZodUpiVpa,
});

export const zodGlobalSettingsInput = (requestData: any) => GlobalSettingsInputSchema.safeParse(requestData);

export const GlobalSettingsToFormKey: Record<string, string> = {
  'bedTypes.2nd.Bed': 'secondBed',
  'bedTypes.2nd.Room': 'secondRoom',
  'bedTypes.2nd.Special': 'secondSpecial',
  'bedTypes.3rd.Bed': 'thirdBed',
  'bedTypes.3rd.Room': 'thirdRoom',
  securityDeposit: 'securityDeposit',
  wifiMonthlyCharge: 'wifiMonthlyCharge',
  upiVpa: 'upiVpa',
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
