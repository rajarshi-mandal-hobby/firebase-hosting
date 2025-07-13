/**
 * Config Service
 * 
 * Handles global settings and admin configuration operations.
 * In production, this will call Firebase Functions.
 */

import type { GlobalSettings, AdminConfig, Admin } from '../../shared/types/firestore-types';
import { dataStore, createMockTimestamp } from '../mock/mockData';
import { 
  simulateNetworkDelay, 
  simulateRandomError, 
  ServiceError,
  validateEmail,
  generateId,
} from '../utils/serviceUtils';

export class ConfigService {
  /**
   * Fetch global application settings
   * Future: Will call Firebase Function or direct Firestore read
   */
  static async getGlobalSettings(): Promise<GlobalSettings> {
    await simulateNetworkDelay();
    simulateRandomError();
    
    return { ...dataStore.globalSettings };
  }

  /**
   * Update global application settings
   * Future: Will call Firebase Function for validation and update
   */
  static async updateGlobalSettings(updates: Partial<GlobalSettings>): Promise<void> {
    await simulateNetworkDelay();
    simulateRandomError();

    // Basic validation
    if (updates.bedTypes) {
      for (const floor in updates.bedTypes) {
        const floorKey = floor as keyof typeof updates.bedTypes;
        const floorBedTypes = updates.bedTypes[floorKey];
        if (floorBedTypes) {
          for (const bedType in floorBedTypes) {
            const rate = floorBedTypes[bedType];
            if (rate <= 0) {
              throw new ServiceError('validation/invalid-amount', `Invalid rate for ${floor} ${bedType}: ${rate}`);
            }
          }
        }
      }
    }

    if (updates.securityDeposit !== undefined && updates.securityDeposit <= 0) {
      throw new ServiceError('validation/invalid-amount', 'Security deposit must be positive');
    }

    if (updates.wifiMonthlyCharge !== undefined && updates.wifiMonthlyCharge <= 0) {
      throw new ServiceError('validation/invalid-amount', 'WiFi charge must be positive');
    }

    // Apply updates
    dataStore.globalSettings = { ...dataStore.globalSettings, ...updates };
  }

  /**
   * Fetch admin management configuration
   * Future: Will call Firebase Function or direct Firestore read
   */
  static async getAdminConfig(): Promise<AdminConfig> {
    await simulateNetworkDelay();
    simulateRandomError();
    
    return { ...dataStore.adminConfig };
  }

  /**
   * Add a new secondary admin
   * Future: Will call Firebase Function for user creation and role assignment
   */
  static async addAdmin(email: string, addedBy: string): Promise<Admin> {
    await simulateNetworkDelay();
    simulateRandomError();

    // Validate email format
    if (!validateEmail(email)) {
      throw new ServiceError('validation/invalid-format', 'Invalid email format');
    }

    // Check if admin already exists
    const existingAdmin = dataStore.adminConfig.list.find(admin => admin.email === email);
    if (existingAdmin) {
      throw new ServiceError('business/duplicate-admin', 'Admin with this email already exists');
    }

    // Check admin limit
    if (dataStore.adminConfig.list.length >= dataStore.adminConfig.maxAdmins) {
      throw new ServiceError('business/max-admins-reached', 'Maximum number of admins reached');
    }

    // Create new admin
    const newAdmin: Admin = {
      email,
      uid: generateId('admin'),
      role: 'secondary',
      addedAt: createMockTimestamp(),
      addedBy,
    };

    dataStore.adminConfig.list.push(newAdmin);
    return newAdmin;
  }

  /**
   * Remove a secondary admin
   * Future: Will call Firebase Function for user role removal
   */
  static async removeAdmin(adminUid: string, removedBy: string): Promise<void> {
    await simulateNetworkDelay();
    simulateRandomError();

    const adminIndex = dataStore.adminConfig.list.findIndex(admin => admin.uid === adminUid);
    if (adminIndex === -1) {
      throw new ServiceError('business/admin-not-found', 'Admin not found');
    }

    const admin = dataStore.adminConfig.list[adminIndex];
    if (admin.role === 'primary') {
      throw new ServiceError('business/primary-admin-removal', 'Cannot remove primary admin');
    }

    if (admin.uid === removedBy) {
      throw new ServiceError('business/self-removal', 'Cannot remove yourself');
    }

    dataStore.adminConfig.list.splice(adminIndex, 1);
  }

  /**
   * Update admin role (primary admin only)
   * Future: Will call Firebase Function for role management
   */
  static async updateAdminRole(adminUid: string, newRole: 'primary' | 'secondary', updatedBy: string): Promise<Admin> {
    await simulateNetworkDelay();
    simulateRandomError();

    const adminIndex = dataStore.adminConfig.list.findIndex(admin => admin.uid === adminUid);
    if (adminIndex === -1) {
      throw new ServiceError('business/admin-not-found', 'Admin not found');
    }

    const admin = dataStore.adminConfig.list[adminIndex];
    
    // Only primary admin can change roles
    const updater = dataStore.adminConfig.list.find(a => a.uid === updatedBy);
    if (!updater || updater.role !== 'primary') {
      throw new ServiceError('auth/permission-denied', 'Only primary admin can update roles');
    }

    // If promoting to primary, demote current primary
    if (newRole === 'primary') {
      const currentPrimary = dataStore.adminConfig.list.find(a => a.role === 'primary');
      if (currentPrimary && currentPrimary.uid !== adminUid) {
        const primaryIndex = dataStore.adminConfig.list.findIndex(a => a.uid === currentPrimary.uid);
        dataStore.adminConfig.list[primaryIndex].role = 'secondary';
      }
      dataStore.adminConfig.primaryAdminUid = adminUid;
    }

    admin.role = newRole;
    dataStore.adminConfig.list[adminIndex] = admin;
    
    return { ...admin };
  }
}
