import { useModalsStack, Modal, Stack, Group, Button, Text } from '@mantine/core';
import { useCallback, useState } from 'react';
import type { Member } from '../../../../shared/types/firestore-types';
import { GenerateBillModalSkeleton } from './GenerateBillModalSkeleton';
import { useGenerateBills } from './hooks/useGenerateBills';
import dayjs from 'dayjs';
import { FormContent } from './GenerateBillsFormContent';
import type { GenerateBillFormData } from './hooks/useGenerateBillsForm';
import { BillingSummary } from './GenerateBillsConfimModal';

interface GenerateBillsModalProps {
  members: Member[];
  opened: boolean;
  onClose: () => void;
}

export type ModalType = 'form' | 'error' | 'confirm';

 const GenerateBillsModal = ({ members, opened, onClose }: GenerateBillsModalProps) => {
  // Only call the hook when modal is opened to prevent unnecessary DB calls
  const { billData, loading, error, actions } = useGenerateBills(opened, members);

  console.log('🎨 Rendering GenerateBillsModal');

  // Modal Stack with 3 modals: form, error, confirm
  const stack = useModalsStack<ModalType>(['form', 'error', 'confirm']);

  const errorModalOpened = !!error && opened;

  const [formData, setFormData] = useState<GenerateBillFormData | null>(null);

  // Handle form submission - open confirm modal
  const handleFormSubmit = (formData: GenerateBillFormData) => {
    setFormData(formData);
    stack.toggle('confirm');
  };

  // Handle comprehensive modal close - reset everything
  const handleModalClose = useCallback(() => {
    stack.closeAll();
    onClose();
  }, [onClose, stack]);

  // Handle bill generation
  const handleConfirmGenerate = async () => {
    if (!formData) {
      throw new Error('Form data is missing');
    }

    console.log('Submitting form data:', formData);
  };

  // Handle error modal retry
  const handleRetry = () => {
    actions.handleReset();
  };

  const handleModalToggle = (modal: ModalType) => {
    if (!opened) {
      handleModalClose();
    }
    stack.close(modal);
  };

  // Do NOT early-return on !opened; we keep stack mounted to allow exit transitions
  return (
    <Modal.Stack>
      {/* Form Modal */}
      <Modal
        {...stack.register('form')}
        title='Generate Bills'
        onClose={handleModalClose}
        opened={opened}
        styles={{
          header: {
            borderBottom: '1px solid var(--mantine-color-gray-3)',
            marginBottom: 'var(--mantine-spacing-xl)',
          },
          title: { fontWeight: 700 },
        }}>
        {!billData || loading ? (
          <GenerateBillModalSkeleton />
        ) : (
          <FormContent billData={billData} onSubmit={handleFormSubmit} onClose={handleModalClose} />
        )}
      </Modal>

      {/* Error Modal */}
      <Modal
        {...stack.register('error')}
        title={'Oops!'}
        opened={errorModalOpened}
        size='sm'
        onClose={handleModalClose}>
        <Stack>
          <Text size='sm' ff='monospace'>
            {error?.message}
          </Text>
          <Group justify='flex-end' mt='md'>
            <Button variant='outline' onClick={handleModalClose}>
              Cancel
            </Button>
            <Button onClick={handleRetry}>Retry</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        {...stack.register('confirm')}
        title={`${formData?.isUpdatingBills ? 'Updating' : 'Creating'} Bills for ${dayjs(
          formData?.selectedBillingMonth
        ).format('MMMM YYYY')}`}
        size='md'>
        {!!formData && (
          <BillingSummary
            formData={formData}
            actions={{
              handleModalToggle,
              handleModalClose,
              handleConfirmGenerate,
            }}
          />
        )}
      </Modal>
    </Modal.Stack>
  );
};

export default GenerateBillsModal;
