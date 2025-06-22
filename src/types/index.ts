// Export all types from a central location
export * from './config';
export * from './student';

// Re-export commonly used types for convenience
export type { ConfigData, ActiveStudentCounts, BedTypeRates } from './config';
export type { Student, RentHistory, Expense, AddStudentFormData, EditStudentFormData } from './student';
