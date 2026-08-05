import { Box, type BoxProps, type ElementProps } from '@mantine/core';
import { DEFAULT_SVG_SIZE } from '../../data/types';

export type GoogleIconName =
    | 'info'
    | 'event'
    | 'person_add'
    | 'receipt_long'
    | 'data_object'
    | 'more_vert'
    | 'logout'
    | 'arrow_back'
    | 'currency_rupee'
    | 'add_2'
    | 'universal_currency_alt'
    | 'lightbulb'
    | 'wifi'
    | 'payments'
    | 'money_bag'
    | 'note'
    | 'share'
    | 'undo'
    | 'history'
    | 'filter_list'
    | 'person_check'
    | 'king_bed'
    | 'search'
    | 'call'
    | 'edit'
    | 'priority_high'
    | 'delete'
    | 'person_remove'
    | 'check'
    | 'check_alert'
    | 'warning'
    | 'person_alert'
    | 'error'
    | 'person'
    | 'edit_off'
    | 'close'
    | 'person_edit';

export interface GoogleIconProps extends Omit<BoxProps, 'fw'>, ElementProps<'span', 'color'> {
    iconName: GoogleIconName;
    filled?: boolean;
    /**
     * Weight and grade affect a symbol's thickness. Adjustments to grade are more granular than adjustments to weight and have a small impact on the size of the symbol.
     */
    emphasize?: boolean | 50 | 100 | 200 | -50;
    /**
     * Weight defines the symbol's stroke weight, with a range of weights between thin (300) and bold (700). Weight can also affect the overall size of the symbol.
     * @default 400
     */
    fw?: 300 | 400 | 500 | 600 | 700 | (string & {}) | (number & {});
    size?: number;
    /**
     * Optical Size offers a way to automatically adjust the stroke weight when you increase or decrease the symbol size.
     * @default 24
     */
    opsz?: 20 | 24 | 40;
}

const getConfig = (emphasize: any, iconSize: number, opsz?: number) => {
    const grade =
        emphasize ?
            typeof emphasize === 'boolean' ?
                200
            :   emphasize
        : iconSize < 16 ? 50
        : iconSize >= 16 && iconSize < 32 ? -50
        : 0;

    return {
        opticalSize: opsz ?? (iconSize >= 16 && iconSize < 32 ? 24 : 40),
        grade
    } as const;
};

export function GoogleIcon({
    iconName,
    size = DEFAULT_SVG_SIZE,
    filled,
    fw,
    emphasize,
    opsz,
    ...boxProps
}: GoogleIconProps) {
    // Converts flags to grade

    const { opticalSize, grade } = getConfig(emphasize, size, opsz);

    return (
        <Box
            component='span'
            className='material-symbols-rounded'
            h={size}
            w={size}
            fz={size}
            style={{
                ...boxProps.style,
                fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${fw ?? 400}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`
            }}
            {...boxProps}
        >
            {iconName}
        </Box>
    );
}

export type IconProps = Omit<GoogleIconProps, 'iconName'>;

export const createIcon = (iconName: GoogleIconName, props: IconProps) => <GoogleIcon iconName={iconName} {...props} />;

// Icons
