// Configuration operations
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  ConfigData,
  AdminConfig,
  BaseConfig,
  ElectricBills,
} from "../components/admin/settings/types/config";

// =============================================
// CONFIG READ OPERATIONS
// =============================================

/**
 * Get the global configuration
 */
export const getConfig = async (): Promise<ConfigData | null> => {
  try {
    const configRef = doc(db, "config", "globalSettings");
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      const data = configSnap.data();
      return {
        ...data,
        // Handle timestamp conversion for new fields
        currentBillingMonth:
          data["currentBillingMonth"]?.toDate() || new Date(),
        nextBillingMonth: data["nextBillingMonth"]?.toDate() || new Date(),
        createdAt: data["createdAt"]?.toDate() || new Date(),
        updatedAt: data["updatedAt"]?.toDate() || new Date(),
        // Ensure wifiOptedIn is used (not wifiOpted)
        activeStudentCounts: {
          ...data["activeStudentCounts"],
          wifiOptedIn:
            data["activeStudentCounts"]?.wifiOptedIn ||
            data["activeStudentCounts"]?.wifiOpted ||
            0,
        },
      } as ConfigData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching config:", error);
    throw error;
  }
};

// =============================================
// ADMIN MANAGEMENT
// =============================================

/**
 * Get admin configuration from separate document
 */
export const getAdminConfig = async (): Promise<AdminConfig | null> => {
  try {
    const adminRef = doc(db, "config", "admins");
    const adminSnap = await getDoc(adminRef);

    if (adminSnap.exists()) {
      const data = adminSnap.data();
      return {
        list: data["list"] || [],
        createdAt: data["createdAt"]?.toDate() || new Date(),
        updatedAt: data["updatedAt"]?.toDate() || new Date(),
      } as AdminConfig;
    }
    return null;
  } catch (error) {
    console.error("Error fetching admin config:", error);
    throw error;
  }
};

/**
 * Update admin configuration
 */
export const updateAdminConfig = async (
  updates: Partial<Omit<AdminConfig, "createdAt" | "updatedAt">>,
): Promise<void> => {
  try {
    const adminRef = doc(db, "config", "admins");
    await updateDoc(adminRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    console.log("✅ Admin config updated successfully");
  } catch (error) {
    console.error("Error updating admin config:", error);
    throw error;
  }
};

/**
 * Initialize admin document if it doesn't exist
 */
export const initializeAdminConfig = async (): Promise<void> => {
  const adminRef = doc(db, "config", "admins");
  const adminSnap = await getDoc(adminRef);

  if (!adminSnap.exists()) {
    const initialAdminConfig: Omit<AdminConfig, "createdAt" | "updatedAt"> = {
      list: [], // Will be populated with Firebase UIDs
    };

    await setDoc(adminRef, {
      ...initialAdminConfig,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Admin config initialized");
  } else {
    console.log("✅ Admin config already exists");
  }
};

// =============================================
// BASE CONFIG OPERATIONS
// =============================================

/**
 * Get base configuration values (floors, bedTypes, deposits, etc.)
 */
export const getBaseConfig = async (): Promise<BaseConfig | null> => {
  try {
    const baseConfigRef = doc(db, "config", "baseSettings");
    const baseConfigSnap = await getDoc(baseConfigRef);

    if (baseConfigSnap.exists()) {
      const data = baseConfigSnap.data();
      return {
        floors: data["floors"],
        bedTypes: data["bedTypes"],
        defaultSecurityDeposit: data["defaultSecurityDeposit"],
        wifiMonthlyCharge: data["wifiMonthlyCharge"],
        createdAt: data["createdAt"]?.toDate() || new Date(),
        updatedAt: data["updatedAt"]?.toDate() || new Date(),
      } as BaseConfig;
    }
    return null;
  } catch (error) {
    console.error("Error fetching base config:", error);
    throw error;
  }
};

/**
 * Initialize base configuration with default values if it doesn't exist
 */
export const initializeBaseConfig = async (): Promise<BaseConfig> => {
  const baseConfigRef = doc(db, "config", "baseSettings");
  const baseConfigSnap = await getDoc(baseConfigRef);

  if (!baseConfigSnap.exists()) {
    const defaultBaseConfig: Omit<BaseConfig, "createdAt" | "updatedAt"> = {
      floors: ["2nd", "3rd"],
      bedTypes: {
        "2nd": {
          Bed: 1600,
          "Special Room": 1700,
          Room: 3200,
        },
        "3rd": {
          Bed: 1600,
          Room: 3200,
        },
      },
      defaultSecurityDeposit: 1000,
      wifiMonthlyCharge: 500,
    };

    await setDoc(baseConfigRef, {
      ...defaultBaseConfig,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Base config initialized with default values");

    return {
      ...defaultBaseConfig,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const data = baseConfigSnap.data();
  return {
    floors: data["floors"],
    bedTypes: data["bedTypes"],
    defaultSecurityDeposit: data["defaultSecurityDeposit"],
    wifiMonthlyCharge: data["wifiMonthlyCharge"],
    createdAt: data["createdAt"]?.toDate() || new Date(),
    updatedAt: data["updatedAt"]?.toDate() || new Date(),
  } as BaseConfig;
};

/**
 * Update base configuration values
 */
export const updateBaseConfig = async (
  updates: Partial<Omit<BaseConfig, "createdAt" | "updatedAt">>,
): Promise<void> => {
  try {
    const baseConfigRef = doc(db, "config", "baseSettings");

    await updateDoc(baseConfigRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Base config updated successfully");
  } catch (error) {
    console.error("Error updating base config:", error);
    throw error;
  }
};

// =============================================
// ELECTRIC BILLS MANAGEMENT
// =============================================

/**
 * Get electric bills for a specific month or all months
 */
export const getElectricBills = async (
  month?: string,
): Promise<ElectricBills | null> => {
  try {
    const billsRef = doc(db, "electricBills", month || "allMonths");
    const billsSnap = await getDoc(billsRef);

    if (billsSnap.exists()) {
      return billsSnap.data() as ElectricBills;
    }
    return null;
  } catch (error) {
    console.error("Error fetching electric bills:", error);
    throw error;
  }
};

/**
 * Update electric bills for a specific month
 */
export const updateElectricBills = async (
  month: string,
  floorBills: Record<string, number>,
): Promise<void> => {
  try {
    const billsRef = doc(db, "electricBills", month);
    await setDoc(
      billsRef,
      {
        [month]: floorBills,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    console.log(`✅ Electric bills updated for ${month}`);
  } catch (error) {
    console.error("Error updating electric bills:", error);
    throw error;
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Recalculate and update active member counts based on current database state
 * Useful for fixing any inconsistencies between config and actual member data
 */
export const recalculateMemberCounts = async (): Promise<void> => {
  try {
    const configRef = doc(db, "config", "globalSettings");

    // Get all active members
    const membersRef = collection(db, "members");
    const activeMembersQuery = query(membersRef, where("isActive", "==", true));
    const activeMembersSnap = await getDocs(activeMembersQuery);

    // Calculate actual counts
    const floorCounts: Record<string, number> = { "2nd": 0, "3rd": 0 };
    let wifiOptedInCount = 0;

    activeMembersSnap.docs.forEach((doc) => {
      const memberData = doc.data();
      const floor = memberData["floor"];
      if (floorCounts[floor] !== undefined) {
        floorCounts[floor]++;
      }
      if (memberData["optedForWifi"] === true) {
        wifiOptedInCount++;
      }
    });

    const totalActiveMembers = activeMembersSnap.size;

    // Update config with recalculated counts
    await updateDoc(configRef, {
      "activeStudentCounts.total": totalActiveMembers,
      "activeStudentCounts.byFloor": floorCounts,
      "activeStudentCounts.wifiOptedIn": wifiOptedInCount,
      updatedAt: serverTimestamp(),
    });

    console.log(
      `✅ Member counts recalculated: ${totalActiveMembers} total, 2nd: ${floorCounts["2nd"]}, 3rd: ${floorCounts["3rd"]}, WiFi: ${wifiOptedInCount}`,
    );
  } catch (error) {
    console.error("Error recalculating member counts:", error);
    throw error;
  }
};

/**
 * Get system statistics
 */
export const getSystemStats = async () => {
  try {
    const [config] = await Promise.all([getConfig()]);

    // Get active members count from collection
    const membersRef = collection(db, "members");
    const activeMembersQuery = query(membersRef, where("isActive", "==", true));
    const activeMembersSnap = await getDocs(activeMembersQuery);

    let totalOutstanding = 0;
    activeMembersSnap.docs.forEach((doc) => {
      const memberData = doc.data();
      totalOutstanding += memberData["outstandingBalance"] || 0;
    });

    return {
      totalMembers: config?.activeStudentCounts.total || 0,
      activeMembers: activeMembersSnap.size,
      totalOutstanding,
      currentBillingCycle:
        config?.currentBillingMonth?.toISOString().slice(0, 7) || "", // Convert date to YYYY-MM format
      wifiOptedCount: config?.activeStudentCounts.wifiOptedIn || 0,
    };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    throw error;
  }
};

// Backward compatibility exports
export const recalculateStudentCounts = recalculateMemberCounts;
