/**
 * useData Hook
 *
 * Custom hook to access the DataContext
 */

import { useContext } from 'react';
import { DataContext, type DataContextType } from '../contexts/DataContext';

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  
  return context;
};
