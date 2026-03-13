import { type AccordionProps, Accordion } from '@mantine/core';
import classesAccordion from './../../css-modules/Accordion.module.css';

export const ContainedAccordion = ({ children, ...props }: AccordionProps) => {
    return (
        <Accordion
            variant='contained'
            classNames={{
                item: classesAccordion['accordion-item'],
                control: classesAccordion['accordion-control'],
                chevron: classesAccordion['accordion-chevron'],
                label: classesAccordion['accordion-label']
            }}
            {...props}
        >
            {children}
        </Accordion>
    );
};
