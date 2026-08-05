import { Alert, Collapse, type CollapseProps } from '@mantine/core';
import { IconError } from '../icons';

interface ErrorAlertProps extends Omit<CollapseProps, 'expanded'> {
    message: string;
    visible: boolean;
    variant?: 'filled' | 'outline';
    withCloseButton?: boolean;
    onClose?: () => void;
}

export const ErrorAlert = ({
    message,
    visible,
    variant = 'filled',
    withCloseButton = false,
    onClose,
    ...props
}: ErrorAlertProps) => (
    <Collapse {...props} expanded={visible}>
        <Alert
            color='red'
            p='xs'
            variant={variant}
            icon={<IconError size={20} emphasize />}
            withCloseButton={withCloseButton}
            onClose={onClose}
            closeButtonLabel='Dismiss Error'
            fw={600}
        >
            {message}
        </Alert>
    </Collapse>
);
