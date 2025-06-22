// Firestore operations for student management system
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  runTransaction
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import type { ConfigData, AdminConfig, BaseConfig, ElectricBills } from '../types/config';
import type { Student, AddStudentFormData, EditStudentFormData, RentHistory } from "@/types/student";

// =============================================
// CONFIG READ OPERATIONS (Backend operations moved to cloud functions)
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
        currentBillingMonth: data['currentBillingMonth']?.toDate() || new Date(),
        nextBillingMonth: data['nextBillingMonth']?.toDate() || new Date(),
        createdAt: data['createdAt']?.toDate() || new Date(),
        updatedAt: data['updatedAt']?.toDate() || new Date(),
        // Ensure wifiOptedIn is used (not wifiOpted)
        activeStudentCounts: {
          ...data['activeStudentCounts'],
          wifiOptedIn: data['activeStudentCounts']?.wifiOptedIn || data['activeStudentCounts']?.wifiOpted || 0
        }
      } as ConfigData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching config:", error);
    throw error;
  }
};

// =============================================
// STUDENT OPERATIONS
// =============================================

/**
 * Generate custom student ID from name and phone
 */
export const generateStudentId = (name: string, phone: string): string => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10); // Last 10 digits
  return `${cleanName}_${cleanPhone}`;
};

/**
 * Calculate rent based on floor and bed type from config
 */
export const calculateRentFromConfig = async (floor: string, bedType: string): Promise<number> => {
  const config = await getConfig();
  if (!config || !config.bedTypes[floor] || !config.bedTypes[floor][bedType]) {
    throw new Error(`Rent not found for floor: ${floor}, bedType: ${bedType}`);
  }
  return config.bedTypes[floor][bedType];
};

/**
 * Add a new student with initial rent history record
 */
export const addStudent = async (formData: AddStudentFormData): Promise<string> => {
  try {
    const studentId = generateStudentId(formData.name, formData.phone);
    
    return await runTransaction(db, async (transaction) => {
      // Check if student already exists
      const studentRef = doc(db, "students", studentId);
      const existingStudent = await transaction.get(studentRef);
      
      if (existingStudent.exists()) {
        throw new Error("Student with this name and phone number already exists");
      }

      // Get current config for rent calculation
      const configRef = doc(db, "config", "globalSettings");
      const configSnap = await transaction.get(configRef);
      
      if (!configSnap.exists()) {
        throw new Error("System configuration not found");
      }
      
      const config = configSnap.data() as ConfigData;
      const currentRent = config.bedTypes[formData.floor]?.[formData.bedType];
      
      if (!currentRent) {
        throw new Error(`Rent not configured for ${formData.floor} - ${formData.bedType}`);
      }

      // Calculate totals
      const totalDepositAgreed = formData.rentAtJoining + formData.advanceDeposit + formData.securityDeposit;
      const actualAmountPaid = formData.fullPayment ? totalDepositAgreed : (formData.actualAmountPaid || 0);
      const currentOutstandingBalance = totalDepositAgreed - actualAmountPaid;      // Create student document
      const studentData: Omit<Student, 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        phone: formData.phone,
        floor: formData.floor,
        bedType: formData.bedType,
        moveInDate: formData.moveInDate,
        securityDeposit: formData.securityDeposit,
        advanceDeposit: formData.advanceDeposit,
        rentAtJoining: formData.rentAtJoining,
        currentRent,
        totalDepositAgreed,
        currentOutstandingBalance,
        isActive: true,
        optedForWifi: false
      };

      transaction.set(studentRef, {
        ...studentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create initial rent history record for the move-in month
      const moveInMonth = formData.moveInDate.toISOString().slice(0, 7); // YYYY-MM
      const rentHistoryRef = doc(db, "students", studentId, "rentHistory", moveInMonth);
      
      const shortfallAmount = currentOutstandingBalance > 0 ? currentOutstandingBalance : 0;
      const expenses = shortfallAmount > 0 ? [{ description: "Joining Shortfall", amount: shortfallAmount }] : [];
      const totalDue = formData.rentAtJoining + shortfallAmount;
      const currentOutstanding = totalDue - actualAmountPaid;
      
      let status: 'Due' | 'Paid' | 'Partially Paid' | 'Overpaid' = 'Due';
      if (currentOutstanding <= 0) status = 'Paid';
      else if (actualAmountPaid > 0) status = 'Partially Paid';

      const rentHistoryData: Omit<RentHistory, 'createdAt' | 'updatedAt'> = {
        id: moveInMonth,
        billingMonth: moveInMonth,
        rent: formData.rentAtJoining,
        electricity: 0,
        wifi: 0,
        previousOutstanding: 0,
        expenses,
        totalDue,
        amountPaid: actualAmountPaid,
        currentOutstanding,
        status,
        notes: "Initial joining record"
      };

      transaction.set(rentHistoryRef, {
        ...rentHistoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update student counts in config
      const newCounts = {
        total: config.activeStudentCounts.total + 1,
        byFloor: {
          ...config.activeStudentCounts.byFloor,
          [formData.floor]: (config.activeStudentCounts.byFloor[formData.floor] || 0) + 1
        },
        wifiOptedIn: config.activeStudentCounts.wifiOptedIn // Unchanged as new students don't opt for wifi initially
      };

      transaction.update(configRef, {
        activeStudentCounts: newCounts,
        updatedAt: serverTimestamp()
      });

      return studentId;
    });
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
};

/**
 * Get all students
 */
export const getAllStudents = async (activeOnly: boolean = true): Promise<Student[]> => {
  try {
    const studentsRef = collection(db, "students");
    const q = activeOnly 
      ? query(studentsRef, where("isActive", "==", true), orderBy("createdAt", "desc"))
      : query(studentsRef, orderBy("createdAt", "desc"));
    
    const querySnap = await getDocs(q);    return querySnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id, // Add the document ID
        name: data['name'],
        phone: data['phone'],
        firebaseUid: data['firebaseUid'],
        floor: data['floor'],
        bedType: data['bedType'],
        securityDeposit: data['securityDeposit'],
        advanceDeposit: data['advanceDeposit'],
        rentAtJoining: data['rentAtJoining'],
        currentRent: data['currentRent'],
        totalDepositAgreed: data['totalDepositAgreed'],
        currentOutstandingBalance: data['currentOutstandingBalance'],
        isActive: data['isActive'],
        optedForWifi: data['optedForWifi'],
        moveInDate: data['moveInDate']?.toDate() || new Date(),
        leaveDate: data['leaveDate']?.toDate(),
        createdAt: data['createdAt']?.toDate() || new Date(),
        updatedAt: data['updatedAt']?.toDate() || new Date()
      } as Student;
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

/**
 * Get a single student by ID
 */
export const getStudent = async (studentId: string): Promise<Student | null> => {
  try {
    const studentRef = doc(db, "students", studentId);
    const studentSnap = await getDoc(studentRef);    if (studentSnap.exists()) {
      const data = studentSnap.data();
      return {
        id: studentSnap.id, // Add the document ID
        name: data['name'],
        phone: data['phone'],
        firebaseUid: data['firebaseUid'],
        floor: data['floor'],
        bedType: data['bedType'],
        securityDeposit: data['securityDeposit'],
        advanceDeposit: data['advanceDeposit'],
        rentAtJoining: data['rentAtJoining'],
        currentRent: data['currentRent'],
        totalDepositAgreed: data['totalDepositAgreed'],
        currentOutstandingBalance: data['currentOutstandingBalance'],
        isActive: data['isActive'],
        optedForWifi: data['optedForWifi'],
        moveInDate: data['moveInDate']?.toDate() || new Date(),
        leaveDate: data['leaveDate']?.toDate(),
        createdAt: data['createdAt']?.toDate() || new Date(),
        updatedAt: data['updatedAt']?.toDate() || new Date()
      } as Student;
    }
    return null;
  } catch (error) {
    console.error("Error fetching student:", error);
    throw error;
  }
};

/**
 * Update student information (floor, bedType, currentRent only)
 */
export const updateStudent = async (studentId: string, formData: EditStudentFormData): Promise<void> => {
  try {
    return await runTransaction(db, async (transaction) => {
      const studentRef = doc(db, "students", studentId);
      const studentSnap = await transaction.get(studentRef);
      
      if (!studentSnap.exists()) {
        throw new Error("Student not found");
      }

      const currentData = studentSnap.data() as Student;
      
      // If floor changed, update the config counts
      if (currentData.floor !== formData.floor) {
        const configRef = doc(db, "config", "globalSettings");
        const configSnap = await transaction.get(configRef);
        
        if (configSnap.exists()) {
          const config = configSnap.data() as ConfigData;
          const newCounts = {
            ...config.activeStudentCounts,
            byFloor: {
              ...config.activeStudentCounts.byFloor,
              [currentData.floor]: Math.max(0, (config.activeStudentCounts.byFloor[currentData.floor] || 0) - 1),
              [formData.floor]: (config.activeStudentCounts.byFloor[formData.floor] || 0) + 1
            }
          };
          
          transaction.update(configRef, {
            activeStudentCounts: newCounts,
            updatedAt: serverTimestamp()
          });
        }
      }

      // Update student data
      transaction.update(studentRef, {
        floor: formData.floor,
        bedType: formData.bedType,
        currentRent: formData.currentRent,
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};

/**
 * Deactivate a student (soft delete)
 */
export const deactivateStudent = async (studentId: string): Promise<void> => {
  try {
    return await runTransaction(db, async (transaction) => {
      const studentRef = doc(db, "students", studentId);
      const studentSnap = await transaction.get(studentRef);
      
      if (!studentSnap.exists()) {
        throw new Error("Student not found");
      }

      const studentData = studentSnap.data() as Student;
      
      // Update config counts
      const configRef = doc(db, "config", "globalSettings");
      const configSnap = await transaction.get(configRef);
      
      if (configSnap.exists()) {
        const config = configSnap.data() as ConfigData;
        const newCounts = {
          total: Math.max(0, config.activeStudentCounts.total - 1),
          byFloor: {
            ...config.activeStudentCounts.byFloor,
            [studentData.floor]: Math.max(0, (config.activeStudentCounts.byFloor[studentData.floor] || 0) - 1)
          },          wifiOptedIn: studentData.optedForWifi 
            ? Math.max(0, config.activeStudentCounts.wifiOptedIn - 1)
            : config.activeStudentCounts.wifiOptedIn
        };
        
        transaction.update(configRef, {
          activeStudentCounts: newCounts,
          updatedAt: serverTimestamp()
        });
      }

      // Deactivate student
      transaction.update(studentRef, {
        isActive: false,
        leaveDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error("Error deactivating student:", error);
    throw error;
  }
};

// =============================================
// RENT HISTORY OPERATIONS
// =============================================

/**
 * Get rent history for a student
 */
export const getStudentRentHistory = async (studentId: string): Promise<RentHistory[]> => {
  try {
    const historyRef = collection(db, "students", studentId, "rentHistory");
    const q = query(historyRef, orderBy("billingMonth", "desc"));
    const querySnap = await getDocs(q);
      return querySnap.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        lastPaymentRecordedDate: data['lastPaymentRecordedDate']?.toDate(),
        createdAt: data['createdAt']?.toDate() || new Date(),
        updatedAt: data['updatedAt']?.toDate() || new Date()
      } as RentHistory;
    });
  } catch (error) {
    console.error("Error fetching rent history:", error);
    throw error;
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Search students by name or phone
 */
export const searchStudents = async (searchTerm: string, activeOnly: boolean = true): Promise<Student[]> => {
  try {
    const allStudents = await getAllStudents(activeOnly);
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return allStudents.filter(student => 
      student.name.toLowerCase().includes(lowerSearchTerm) ||
      student.phone.includes(searchTerm)
    );
  } catch (error) {
    console.error("Error searching students:", error);
    throw error;
  }
};

/**
 * Calculate settlement preview before deletion using cloud function
 * This function calls the Firebase cloud function to get exact settlement calculation
 */
export const calculateSettlementPreview = async (studentId: string, leaveDate: Date) => {
  try {
    const previewFunction = httpsCallable(functions, 'calculateSettlementPreview');
    
    const result = await previewFunction({
      studentId,
      leaveDate: leaveDate.toISOString()
    });
    
    return result.data;
  } catch (error) {
    console.error("Error calculating settlement preview:", error);
    throw error;
  }
};

/**
 * Delete student with settlement calculation using cloud function
 * This function calls the Firebase cloud function to handle the complete deletion workflow
 */
export const deleteStudentWithSettlement = async (studentId: string, leaveDate: Date): Promise<void> => {
  try {
    const deleteFunction = httpsCallable(functions, 'deleteStudentWithSettlement');
    
    const result = await deleteFunction({
      studentId,
      leaveDate: leaveDate.toISOString()
    });
    
    console.log('Student deleted successfully:', result.data);
  } catch (error) {
    console.error("Error deleting student with settlement:", error);
    throw error;
  }
};

/**
 * Get system statistics
 */
export const getSystemStats = async () => {
  try {
    const [config, students] = await Promise.all([
      getConfig(),
      getAllStudents(true)
    ]);

    const totalOutstanding = students.reduce((sum, student) => sum + student.currentOutstandingBalance, 0);

    return {
      totalStudents: config?.activeStudentCounts.total || 0,
      activeStudents: students.length,
      totalOutstanding,      currentBillingCycle: config?.currentBillingMonth?.toISOString().slice(0, 7) || '', // Convert date to YYYY-MM format
      wifiOptedCount: config?.activeStudentCounts.wifiOptedIn || 0
    };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    throw error;
  }
};

// =============================================
// ADMIN MANAGEMENT (Separate Document)
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
        list: data['list'] || [],
        createdAt: data['createdAt']?.toDate() || new Date(),
        updatedAt: data['updatedAt']?.toDate() || new Date()
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
export const updateAdminConfig = async (updates: Partial<Omit<AdminConfig, 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const adminRef = doc(db, "config", "admins");
    await updateDoc(adminRef, {
      ...updates,
      updatedAt: serverTimestamp()
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
    const initialAdminConfig: Omit<AdminConfig, 'createdAt' | 'updatedAt'> = {
      list: [] // Will be populated with Firebase UIDs
    };

    await setDoc(adminRef, {
      ...initialAdminConfig,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log("✅ Admin config initialized");
  } else {
    console.log("✅ Admin config already exists");
  }
};

// =============================================
// ELECTRIC BILLS MANAGEMENT
// =============================================

/**
 * Get electric bills for a specific month or all months
 */
export const getElectricBills = async (month?: string): Promise<ElectricBills | null> => {
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
export const updateElectricBills = async (month: string, floorBills: Record<string, number>): Promise<void> => {
  try {
    const billsRef = doc(db, "electricBills", month);
    await setDoc(billsRef, {
      [month]: floorBills,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log(`✅ Electric bills updated for ${month}`);
  } catch (error) {
    console.error("Error updating electric bills:", error);
    throw error;
  }
};

/**
 * Recalculate and update active student counts based on current database state
 * Useful for fixing any inconsistencies between config and actual student data
 */
export const recalculateStudentCounts = async (): Promise<void> => {
  try {
    const configRef = doc(db, "config", "globalSettings");
    
    // Get all active students
    const studentsRef = collection(db, "students");
    const activeStudentsQuery = query(studentsRef, where("isActive", "==", true));
    const activeStudentsSnap = await getDocs(activeStudentsQuery);
    
    // Calculate actual counts
    const floorCounts: Record<string, number> = { "2nd": 0, "3rd": 0 };
    let wifiOptedInCount = 0;
    
    activeStudentsSnap.docs.forEach(doc => {
      const studentData = doc.data();
      const floor = studentData['floor'];
      if (floorCounts[floor] !== undefined) {
        floorCounts[floor]++;
      }
      if (studentData['optedForWifi'] === true) {
        wifiOptedInCount++;
      }
    });

    const totalActiveStudents = activeStudentsSnap.size;

    // Update config with recalculated counts
    await updateDoc(configRef, {
      'activeStudentCounts.total': totalActiveStudents,
      'activeStudentCounts.byFloor': floorCounts,
      'activeStudentCounts.wifiOptedIn': wifiOptedInCount,
      updatedAt: serverTimestamp()
    });

    console.log(`✅ Student counts recalculated: ${totalActiveStudents} total, 2nd: ${floorCounts["2nd"]}, 3rd: ${floorCounts["3rd"]}, WiFi: ${wifiOptedInCount}`);
  } catch (error) {
    console.error("Error recalculating student counts:", error);
    throw error;
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
        floors: data['floors'],
        bedTypes: data['bedTypes'],
        defaultSecurityDeposit: data['defaultSecurityDeposit'],
        wifiMonthlyCharge: data['wifiMonthlyCharge'],
        createdAt: data['createdAt']?.toDate() || new Date(),
        updatedAt: data['updatedAt']?.toDate() || new Date()
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
    const defaultBaseConfig: Omit<BaseConfig, 'createdAt' | 'updatedAt'> = {
      floors: ['2nd', '3rd'],
      bedTypes: {
        "2nd": {
          "Bed": 1600,
          "Special Room": 1700,
          "Room": 3200
        },
        "3rd": {
          "Bed": 1600,
          "Room": 3200
        }
      },
      defaultSecurityDeposit: 1000,
      wifiMonthlyCharge: 500
    };

    await setDoc(baseConfigRef, {
      ...defaultBaseConfig,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log("✅ Base config initialized with default values");
    
    return {
      ...defaultBaseConfig,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  const data = baseConfigSnap.data();
  return {
    floors: data['floors'],
    bedTypes: data['bedTypes'],
    defaultSecurityDeposit: data['defaultSecurityDeposit'],
    wifiMonthlyCharge: data['wifiMonthlyCharge'],
    createdAt: data['createdAt']?.toDate() || new Date(),
    updatedAt: data['updatedAt']?.toDate() || new Date()
  } as BaseConfig;
};

/**
 * Update base configuration values
 */
export const updateBaseConfig = async (updates: Partial<Omit<BaseConfig, 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const baseConfigRef = doc(db, "config", "baseSettings");
    
    await updateDoc(baseConfigRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    console.log("✅ Base config updated successfully");
  } catch (error) {
    console.error("Error updating base config:", error);
    throw error;
  }
};
