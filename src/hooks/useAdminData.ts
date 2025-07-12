import { useContext } from 'react';
import { AdminDataContext } from '../contexts/AdminDataContext';

// Hook to use the context
export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
};

// Individual hooks for specific data
export const useRentData = () => {
  const { rentData } = useAdminData();
  return rentData;
};
