import { useScrollIntoView } from '@mantine/hooks';

/**
 * Scroll to the active accordion item
 * Use this hook to Accordion.Control onTransitionEnd prop
 * @returns {function(e: React.TransitionEvent<HTMLButtonElement>): void} - Function to scroll to the active accordion item
 */
export const useAccordionScrollToView = () => {
    const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>();

    const handleScrollToItem = (e: React.TransitionEvent<HTMLButtonElement>) => {
        targetRef.current = e.currentTarget.closest('.mantine-Accordion-item');
        if (e.currentTarget.closest('.mantine-Accordion-item')?.getAttribute('data-active') === 'true') {
            scrollIntoView({ alignment: 'center' });
        }
    };

    return handleScrollToItem;
};
