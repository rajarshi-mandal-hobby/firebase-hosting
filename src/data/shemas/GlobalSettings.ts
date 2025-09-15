import { type SnapshotOptions, type Timestamp, QueryDocumentSnapshot } from 'firebase/firestore';

export type Floor = '2nd' | '3rd';

export type BedType = 'Bed' | 'Room' | 'Special';

type SecondFloor = {
  readonly Bed: number;
  readonly Room: number;
  readonly Special: number;
};

interface ThirdFloor {
  readonly Bed: number;
  readonly Room: number;
}

type BedRents = {
  readonly [F in Floor]: F extends '2nd' ? SecondFloor : ThirdFloor;
};

export class GlobalSettings {
  constructor(
    readonly bedRents: BedRents,
    readonly securityDeposit: number,
    readonly wifiMonthlyCharge: number,
    readonly upiVpa: string,
    readonly activeMemberCounts: {
      readonly total: number;
      readonly byFloor: {
        readonly [F in Floor]: number;
      };
      readonly wifiOptedIn: number;
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
}

export type GlobalSettingsFormValues = Omit<
  GlobalSettings,
  'activeMemberCounts' | 'currentBillingMonth' | 'nextBillingMonth'
>;
