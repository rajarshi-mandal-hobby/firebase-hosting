import type { Member } from '../../../../shared/types/firestore-types.ts';

// export { MemberModal } from './MemberModal';
export { DeleteMemberModal } from './DeleteMemberModal';
export { DeactivationModal } from './DeactivationModal';
export { ActivationModal } from './ActivationModal.tsx';

export type MemberActionModalProps = {
  opened: boolean;
  member: Member | null;
  onClose: () => void;
  onExitTransitionEnd?: () => void;
}
