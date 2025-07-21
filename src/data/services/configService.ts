/**
 * Config Service
 *
 * Handles global settings and admin configuration operations.
 * Uses real Firestore with proper error handling.
 */

import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { GlobalSettings, AdminConfig, Admin } from '../../shared/types/firestore-types';
import { ServiceError, validateEmail, generateId } from '../utils/serviceUtils';

export class ConfigService {
  /**
   * Fetch global application settings from Firestore
   */
  static async getGlobalSettings(): Promise<GlobalSettings> {
    try {
      const globalSettingsRef = doc(db, 'config', 'globalSettings');
      const globalSettingsDoc = await getDoc(globalSettingsRef);

      if (!globalSettingsDoc.exists()) {
        throw new ServiceError('firestore/document-not-found', 'Global settings not found');
      }

      return globalSettingsDoc.data() as GlobalSettings;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('firestore/read-error', 'Failed to fetch global settings');
    }
  }

  /**
   * Update global application settings in Firestore
   */
  static async updateGlobalSettings(updates: Partial<GlobalSettings>): Promise<void> {
    try {
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

      const globalSettingsRef = doc(db, 'config', 'globalSettings');
      await updateDoc(globalSettingsRef, updates);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('firestore/write-error', 'Failed to update global settings');
    }
  }

  /**
   * Fetch admin management configuration from Firestore
   */
  static async getAdminConfig(): Promise<AdminConfig> {
    try {
      const adminConfigRef = doc(db, 'config', 'adminConfig');
      const adminConfigDoc = await getDoc(adminConfigRef);

      if (!adminConfigDoc.exists()) {
        throw new ServiceError('firestore/document-not-found', 'Admin configuration not found');
      }

      return adminConfigDoc.data() as AdminConfig;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('firestore/read-error', 'Failed to fetch admin configuration');
    }
  }

  /**
   * Add a new secondary admin
   */
  static async addAdmin(email: string, addedBy: string): Promise<Admin> {
    try {
      if (!validateEmail(email)) {
        throw new ServiceError('validation/invalid-format', 'Invalid email format');
      }

      const adminConfigRef = doc(db, 'config', 'adminConfig');
      const adminConfigDoc = await getDoc(adminConfigRef);

      if (!adminConfigDoc.exists()) {
        throw new ServiceError('firestore/document-not-found', 'Admin configuration not found');
      }

      const adminConfig = adminConfigDoc.data() as AdminConfig;

      // Check if admin already exists
      const existingAdmin = adminConfig.list.find((admin) => admin.email === email);
      if (existingAdmin) {
        throw new ServiceError('business/duplicate-admin', 'Admin with this email already exists');
      }

      // Check admin limit
      if (adminConfig.list.length >= adminConfig.maxAdmins) {
        throw new ServiceError('business/max-admins-reached', 'Maximum number of admins reached');
      }

      // Create new admin
      const newAdmin: Admin = {
        email,
        uid: generateId('admin'),
        role: 'secondary',
        addedAt: Timestamp.now(),
        addedBy,
      };

      const updatedList = [...adminConfig.list, newAdmin];
      await updateDoc(adminConfigRef, { list: updatedList });

      return newAdmin;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('firestore/write-error', 'Failed to add admin');
    }
  }

  /**
   * Remove a secondary admin
   */
  static async removeAdmin(adminUid: string, removedBy: string): Promise<void> {
    try {
      const adminConfigRef = doc(db, 'config', 'adminConfig');
      const adminConfigDoc = await getDoc(adminConfigRef);

      if (!adminConfigDoc.exists()) {
        throw new ServiceError('firestore/document-not-found', 'Admin configuration not found');
      }

      const adminConfig = adminConfigDoc.data() as AdminConfig;

      const adminIndex = adminConfig.list.findIndex((admin) => admin.uid === adminUid);
      if (adminIndex === -1) {
        throw new ServiceError('business/admin-not-found', 'Admin not found');
      }

      const admin = adminConfig.list[adminIndex];
      if (admin.role === 'primary') {
        throw new ServiceError('business/primary-admin-removal', 'Cannot remove primary admin');
      }

      if (admin.uid === removedBy) {
        throw new ServiceError('business/self-removal', 'Cannot remove yourself');
      }

      const updatedList = adminConfig.list.filter((admin) => admin.uid !== adminUid);
      await updateDoc(adminConfigRef, { list: updatedList });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('firestore/write-error', 'Failed to remove admin');
    }
  }

  /**
   * Update admin role (primary admin only)
   */
  static async updateAdminRole(adminUid: string, newRole: 'primary' | 'secondary', updatedBy: string): Promise<Admin> {
    try {
      const adminConfigRef = doc(db, 'config', 'adminConfig');
      const adminConfigDoc = await getDoc(adminConfigRef);

      if (!adminConfigDoc.exists()) {
        throw new ServiceError('firestore/document-not-found', 'Admin configuration not found');
      }

      const adminConfig = adminConfigDoc.data() as AdminConfig;

      const adminIndex = adminConfig.list.findIndex((admin) => admin.uid === adminUid);
      if (adminIndex === -1) {
        throw new ServiceError('business/admin-not-found', 'Admin not found');
      }

      const admin = adminConfig.list[adminIndex];

      // Only primary admin can change roles
      const updater = adminConfig.list.find((a) => a.uid === updatedBy);
      if (!updater || updater.role !== 'primary') {
        throw new ServiceError('auth/permission-denied', 'Only primary admin can update roles');
      }

      const updatedList = [...adminConfig.list];

      // If promoting to primary, demote current primary
      if (newRole === 'primary') {
        const currentPrimaryIndex = updatedList.findIndex((a) => a.role === 'primary');
        if (currentPrimaryIndex !== -1 && updatedList[currentPrimaryIndex].uid !== adminUid) {
          updatedList[currentPrimaryIndex] = {
            ...updatedList[currentPrimaryIndex],
            role: 'secondary',
          };
        }
      }

      // Update the target admin's role
      updatedList[adminIndex] = {
        ...admin,
        role: newRole,
      };

      // Prepare updates
      const updates: Partial<AdminConfig> = { list: updatedList };
      if (newRole === 'primary') {
        updates.primaryAdminUid = adminUid;
      }

      await updateDoc(adminConfigRef, updates);

      return updatedList[adminIndex];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('firestore/write-error', 'Failed to update admin role');
    }
  }
}
