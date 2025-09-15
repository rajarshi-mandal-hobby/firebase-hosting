import type { AdminConfig } from '../shemas/AdminConfig';
import type { GlobalSettings } from '../shemas/GlobalSettings';

export interface ConfigCollection {
  globalSettings: GlobalSettings | null;
  admins: AdminConfig | null;
}
