import type { GeneralStatus, PaymentStatus } from '../types/firestore-types';
import { StatusBadge } from './StatusBadge';

// StatusIndicator component (merged from StatusIndicator.tsx)
interface StatusIndicatorProps {
  status: GeneralStatus;
  size?: number;
  children: React.ReactNode;
}

// Simple mapping for GeneralStatus-only statuses
const generalStatusMap = {
  active: 'Paid',
  inactive: 'Due',
} as const;

export function StatusIndicator({ status, size = 16, children }: StatusIndicatorProps) {
  // Map GeneralStatus to PaymentStatus for reuse
  const paymentStatus: GeneralStatus =
    generalStatusMap[status as keyof typeof generalStatusMap] || (status as PaymentStatus);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          borderRadius: '50%',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        }}>
        <StatusBadge status={paymentStatus} size={size - 2} />
      </div>
    </div>
  );
}
