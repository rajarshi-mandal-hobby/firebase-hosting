import { type AccordionProps, Accordion } from '@mantine/core';
import classesAccordion from './../../css-modules/Accordion.module.css';

export const ContainedAccordion = ({ children, ...props }: AccordionProps) => {
    return (
        <Accordion
            variant='contained'
            classNames={classesAccordion}
            {...props}
        >
            {children}
        </Accordion>
    );
};
