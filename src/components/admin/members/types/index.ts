/**
 * Member Component Types and Interfaces
 *
 * This file contains all type definitions specific to the member management components.
 * These types are separate from the main member business logic types (in src/types/member.ts)
 * and focus on component props, UI state, and component-specific configurations.
 *
 * Organization:
 * - Component Prop Interfaces: For React component props
 * - Component State Interfaces: For internal component state management
 * - UI-Specific Types: For UI-related configurations and enums
 */

// Member component interfaces and types
import type { Member } from "./member";

// =============================================
// COMPONENT PROP INTERFACES
// =============================================

/**
 * Props for the MembersSection component
 */
export interface MembersSectionProps {
  members: Member[];
  loading: boolean;
}

/**
 * Props for the MemberModal component (Add/Edit member)
 */
export interface MemberModalProps {
  opened: boolean;
  onClose: () => void;
  editingMember: Member | null;
  hasOnlyOneRentHistory?: boolean;
}

/**
 * Props for the DeleteMemberModal component
 */
export interface DeleteMemberModalProps {
  opened: boolean;
  onClose: () => void;
  member: Member | null;
}

// =============================================
// COMPONENT STATE INTERFACES
// =============================================

/**
 * State for member search and filtering
 */
export interface MemberSearchState {
  query: string;
  filters: {
    floor?: string;
    bedType?: string;
    status?: "active" | "inactive" | "all";
  };
}

/**
 * State for member form validation
 */
export interface MemberFormState {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// =============================================
// UI-SPECIFIC TYPES
// =============================================

/**
 * Member table column configuration
 */
export interface MemberTableColumn {
  key: keyof Member | "actions";
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

/**
 * Member action types for context menus
 */
export type MemberActionType =
  | "edit"
  | "delete"
  | "view"
  | "generate-bill"
  | "settlement";

/**
 * Member modal modes
 */
export type MemberModalMode = "add" | "edit" | "view";

/**
 * Member list view modes
 */
export type MemberViewMode = "table" | "grid" | "compact";

// =============================================
// FORM DATA INTERFACES
// =============================================

/**
 * Form data structure for Member Modal
 */
export interface MemberFormData {
  name: string;
  phone: string;
  floor: string;
  bedType: string;
  moveInDate: Date;
  rentAtJoining: number;
  currentRent: number;
  securityDeposit: number;
  advanceDeposit: number;
  actualAmountPaid: number;
}

/**
 * Form validation errors structure
 */
export interface MemberFormErrors {
  name?: string;
  phone?: string;
  floor?: string;
  bedType?: string;
  actualAmountPaid?: string;
  [key: string]: string | undefined;
}
