import type { DocumentData } from 'firebase/firestore';
import type { Admin } from '../../shared/types/firestore-types';

export class AdminConfig {
  constructor(readonly list: Admin[], readonly primaryAdminUid: string, readonly maxAdmins: number) {}

  static fromFirestore(data: DocumentData): AdminConfig {
    return new AdminConfig(data.list, data.primaryAdminUid, data.maxAdmins);
  }

  static toFirestore(config: Partial<AdminConfig>): DocumentData {
    return {
      list: config.list,
      primaryAdminUid: config.primaryAdminUid,
      maxAdmins: config.maxAdmins,
    };
  }
}
