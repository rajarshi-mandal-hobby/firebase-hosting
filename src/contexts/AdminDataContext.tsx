import React, { createContext } from 'react';
import type { ReactNode } from 'react';
import { useRentManagementData, type UseRentManagementData } from '../features/rent/hooks/useRentManagementData';

// Create the context
export const AdminDataContext = createContext<{
  rentData: UseRentManagementData;
} | null>(null);

// Provider component
interface AdminDataProviderProps {
  children: ReactNode;
}

export const AdminDataProvider: React.FC<AdminDataProviderProps> = ({ children }) => {
  const rentData = useRentManagementData();
  
  return (
    <AdminDataContext.Provider value={{ rentData }}>
      {children}
    </AdminDataContext.Provider>
  );
};
