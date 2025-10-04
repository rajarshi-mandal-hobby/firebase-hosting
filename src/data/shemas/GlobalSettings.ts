import { type SnapshotOptions, type Timestamp, QueryDocumentSnapshot } from 'firebase/firestore';

export type Floor = '2nd' | '3rd';
export type BedType = 'Bed' | 'Room' | 'Special';

// Only allow 'Bed', 'Room', 'Special' as keys, but 'Special' is only for '2nd'
type SecondFloor = Pick<Record<BedType, number>, 'Bed' | 'Room' | 'Special'>;
type ThirdFloor = Pick<Record<BedType, number>, 'Bed' | 'Room'>;

export type BedRents = {
  [F in Floor]: F extends '2nd' ? SecondFloor : ThirdFloor;
};

export type GlobalSettingsFormValues = {
  bedRents: BedRents;
  securityDeposit: number;
  wifiMonthlyCharge: number;
  upiVpa: string;
};

export class GlobalSettings {
  constructor(
    readonly bedRents: BedRents,
    readonly securityDeposit: number,
    readonly wifiMonthlyCharge: number,
    readonly upiVpa: string,
    readonly activeMemberCounts: {
      readonly [F in Floor]: number;
    },
    readonly currentBillingMonth: Timestamp,
    readonly nextBillingMonth: Timestamp
  ) {}

  static toFirestore(settings: GlobalSettings): GlobalSettingsFormValues {
    return {
      bedRents: settings.bedRents,
      securityDeposit: Number(settings.securityDeposit),
      wifiMonthlyCharge: Number(settings.wifiMonthlyCharge),
      upiVpa: String(settings.upiVpa).trim(),
    };
  }

  static fromFirestore(snap: QueryDocumentSnapshot<GlobalSettings>, options?: SnapshotOptions): GlobalSettings {
    const data = snap.data(options);
    return new GlobalSettings(
      data.bedRents,
      data.securityDeposit,
      data.wifiMonthlyCharge,
      data.upiVpa,
      data.activeMemberCounts,
      data.currentBillingMonth,
      data.nextBillingMonth
    );
  }

  static toFormValues(settings: GlobalSettings): GlobalSettingsFormValues {
    return {
      bedRents: settings.bedRents,
      securityDeposit: Number(settings.securityDeposit),
      wifiMonthlyCharge: Number(settings.wifiMonthlyCharge),
      upiVpa: String(settings.upiVpa).trim(),
    };
  }
}
