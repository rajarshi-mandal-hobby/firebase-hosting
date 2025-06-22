// Configuration Management component - Refactored to use modular components and hooks
import React from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  Switch,
  Alert,
  Loader,
  Center,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useConfigForm } from '../hooks/useConfigForm';
import { ConfigFormCards } from './ConfigFormCards';
import { ConfigActions } from './ConfigActions';

const ConfigManagement: React.FC = () => {
  const {
    // Config data
    config,
    loading,
    error,
    
    // Form state
    configForm,
    editMode,
    setEditMode,
    submitting,
    showForm,
    
    // Error states
    showValidationErrors,
    
    // Confirmation modal
    confirmationModal,
    setConfirmationModal,
    
    // Computed values
    shouldShowForm,
    hasChanges,
    areAllFieldsFilled,
    
    // Helper functions
    handleNumericValue,
    isFieldUnset,
    getFieldError,
    clearErrorsOnChange,
    
    // Action handlers
    handleBedValueChange,
    showConfigurationForm,
    handleReset,
    handleUpdate,
  } = useConfigForm();

  return (
    <Stack gap='xl'>
      {/* Loading State */}
      {loading && (
        <Center py='xl'>
          <Stack align='center' gap='sm'>
            <Loader size='md' />
            <Text size='sm' c='dimmed'>
              Loading configuration...
            </Text>
          </Stack>
        </Center>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert variant='light' color='red' title='Configuration Error' icon={<IconInfoCircle />}>
          {error}
        </Alert>
      )}

      {/* No Config - Create Base Config */}
      {!loading && !error && !config && !showForm && (
        <Alert variant='light' color='blue' title='Configuration Setup Required' icon={<IconInfoCircle />}>
          <Stack gap='md'>
            <Text size='sm'>
              No configuration found. A base configuration with default values needs to be created before you can manage
              settings.
            </Text>
            <Button onClick={showConfigurationForm} size='sm'>
              Create Base Configuration
            </Button>
          </Stack>
        </Alert>
      )}

      {/* Configuration Form - Show when config exists OR when showForm is true */}
      {/* Uses key pattern to properly reinitialize form when config changes */}
      {!loading && shouldShowForm && (
        <div key={config ? 'with-config' : 'new-config'}>
          {/* Enable Editing Toggle */}
          <Group justify='space-between' align='center' mb='md'>
            <Switch
              checked={editMode}
              onChange={(event) => setEditMode(event.currentTarget.checked)}
              label='Enable Editing'
              size='sm'
            />
            <Text size='xs' c='dimmed'>
              This will enable all fields
            </Text>
          </Group>

          {/* Form Cards */}
          <ConfigFormCards
            configForm={configForm}
            editMode={editMode}
            showValidationErrors={showValidationErrors}
            getFieldError={getFieldError}
            isFieldUnset={isFieldUnset}
            handleBedValueChange={handleBedValueChange}
            handleNumericValue={handleNumericValue}
            clearErrorsOnChange={clearErrorsOnChange}
          />

          {/* Action Buttons and Modal */}
          <ConfigActions
            editMode={editMode}
            hasChanges={hasChanges}
            areAllFieldsFilled={areAllFieldsFilled}
            submitting={submitting}
            confirmationModal={confirmationModal}
            setConfirmationModal={setConfirmationModal}
            handleReset={handleReset}
            handleUpdate={handleUpdate}
          />
        </div>
      )}
    </Stack>
  );
};

export default ConfigManagement;
