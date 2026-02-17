import { getThemeColor, useMantineTheme } from '@mantine/core';
import { type ReactElement, type SVGProps, type ComponentType, Children, cloneElement, isValidElement } from 'react';
import { DEFAULT_SVG_SIZE } from '../types';

// Define the structure for the props the output SVG will accept
interface CustomSvgProps extends SVGProps<SVGSVGElement> {
    size?: number;
}

// Type for the icon component
export type IconComponent = ComponentType<CustomSvgProps>;

const useIconColor = (color?: string) => {
    const theme = useMantineTheme();
    return color ? getThemeColor(color, theme) : 'currentColor';
};

const createCustomSvg = (svg: ReactElement<CustomSvgProps, 'svg'>, displayName: string): IconComponent => {
    // Extract and clone path elements to avoid prop conflicts
    const pathElements =
        Children.map(svg.props.children, (child) => {
            if (isValidElement(child) && child.type === 'path') {
                // ✅ Clone paths and remove conflicting props
                return cloneElement(child as ReactElement<SVGProps<SVGPathElement>>, {
                    fill: undefined,
                    stroke: undefined
                });
            }
            return null;
        })?.filter(Boolean) || [];

    // Return a new functional component that renders the customized SVG.
    const CustomIcon = ({ size = DEFAULT_SVG_SIZE, color, style, ...others }: CustomSvgProps) => {
        // Return the new SVG element with our custom props and the extracted paths.
        const iconColor = useIconColor(color);
        return (
            <svg
                xmlns='http://www.w3.org/2000/svg'
                height={size}
                width={size}
                // Retain original viewBox if no new viewBox is provided.
                viewBox={svg.props.viewBox || '0 0 24 24'}
                fill={iconColor} // Use currentColor to inherit the parent color.
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}
                {...others}
            >
                {pathElements}
            </svg>
        );
    };
    // Add the displayName property to the CustomIcon component after its definition.
    CustomIcon.displayName = displayName;
    return CustomIcon;
};

export const IconEditOff = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='m622-453-56-56 82-82-57-57-82 82-56-56 195-195q12-12 26.5-17.5T705-840q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L622-453ZM200-200h57l195-195-28-29-29-28-195 195v57ZM792-56 509-338 290-120H120v-169l219-219L56-792l57-57 736 736-57 57Zm-32-648-56-56 56 56Zm-169 56 57 57-57-57ZM424-424l-29-28 57 57-28-29Z' />
    </svg>,
    'EditOff'
);

export const IconHistory = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M480-80q-155 0-269-103T82-440h81q15 121 105.5 200.5T480-160q134 0 227-93t93-227q0-134-93-227t-227-93q-86 0-159.5 42.5T204-640h116v80H88q29-140 139-230t253-90q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm112-232L440-464v-216h80v184l128 128-56 56Z' />
    </svg>,
    'History'
);

export const IconEdit = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z' />
    </svg>,
    'Edit'
);

export const IconInfo = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z' />
    </svg>,
    'Info'
);

export const IconBack = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z' />
    </svg>,
    'Back'
);

export const IconSearch = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z' />
    </svg>,
    'Search'
);

export const IconFilter = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M400-240v-80h160v80H400ZM240-440v-80h480v80H240ZM120-640v-80h720v80H120Z' />
    </svg>,
    'Filter'
);

export const IconPerson = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z' />
    </svg>,
    'Person'
);

export const IconCalendarMonth = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z' />
    </svg>,
    'CalendarMonth'
);

export const IconBed = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M80-200v-240q0-27 11-49t29-39v-112q0-50 35-85t85-35h160q23 0 43 8.5t37 23.5q17-15 37-23.5t43-8.5h160q50 0 85 35t35 85v112q18 17 29 39t11 49v240h-80v-80H160v80H80Zm440-360h240v-80q0-17-11.5-28.5T720-680H560q-17 0-28.5 11.5T520-640v80Zm-320 0h240v-80q0-17-11.5-28.5T400-680H240q-17 0-28.5 11.5T200-640v80Zm-40 200h640v-80q0-17-11.5-28.5T760-480H200q-17 0-28.5 11.5T160-440v80Zm640 0H160h640Z' />
    </svg>,
    'Bed'
);

export const IconUniversalCurrency = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M600-320h160v-160h-60v100H600v60Zm-120-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM200-480h60v-100h100v-60H200v160ZM80-200v-560h800v560H80Zm80-80h640v-400H160v400Zm0 0v-400 400Z' />
    </svg>,
    'UniversalCurrency'
);

export const IconWifi = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M480-120q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM254-346l-84-86q59-59 138.5-93.5T480-560q92 0 171.5 35T790-430l-84 84q-44-44-102-69t-124-25q-66 0-124 25t-102 69ZM84-516 0-600q92-94 215-147t265-53q142 0 265 53t215 147l-84 84q-77-77-178.5-120.5T480-680q-116 0-217.5 43.5T84-516Z' />
    </svg>,
    'Wifi'
);

export const IconPayments = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M560-440q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM280-320q-33 0-56.5-23.5T200-400v-320q0-33 23.5-56.5T280-800h560q33 0 56.5 23.5T920-720v320q0 33-23.5 56.5T840-320H280Zm80-80h400q0-33 23.5-56.5T840-480v-160q-33 0-56.5-23.5T760-720H360q0 33-23.5 56.5T280-640v160q33 0 56.5 23.5T360-400Zm440 240H120q-33 0-56.5-23.5T40-240v-440h80v440h680v80ZM280-400v-320 320Z' />
    </svg>,
    'Payments'
);

export const IconBulb = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-200v-80h320v80H320Zm10-120q-69-41-109.5-110T180-580q0-125 87.5-212.5T480-880q125 0 212.5 87.5T780-580q0 81-40.5 150T630-320H330Zm24-80h252q45-32 69.5-79T700-580q0-92-64-156t-156-64q-92 0-156 64t-64 156q0 54 24.5 101t69.5 79Zm126 0Z' />
    </svg>,
    'Bulb'
);

export const IconRupee = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M549-120 280-400v-80h140q53 0 91.5-34.5T558-600H240v-80h306q-17-35-50.5-57.5T420-760H240v-80h480v80H590q14 17 25 37t17 43h88v80h-81q-8 85-70 142.5T420-400h-29l269 280H549Z' />
    </svg>,
    'Rupee'
);

export const IconMoneyBag = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M336-120q-91 0-153.5-62.5T120-336q0-38 13-74t37-65l142-171-97-194h530l-97 194 142 171q24 29 37 65t13 74q0 91-63 153.5T624-120H336Zm144-200q-33 0-56.5-23.5T400-400q0-33 23.5-56.5T480-480q33 0 56.5 23.5T560-400q0 33-23.5 56.5T480-320Zm-95-360h190l40-80H345l40 80Zm-49 480h288q57 0 96.5-39.5T760-336q0-24-8.5-46.5T728-423L581-600H380L232-424q-15 18-23.5 41t-8.5 47q0 57 39.5 96.5T336-200Z' />
    </svg>,
    'MoneyBag'
);

export const IconNote = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M280-280h84l240-238-86-86-238 238v86Zm352-266 42-44q6-6 6-14t-6-14l-56-56q-6-6-14-6t-14 6l-44 42 86 86ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm280-590q13 0 21.5-8.5T510-820q0-13-8.5-21.5T480-850q-13 0-21.5 8.5T450-820q0 13 8.5 21.5T480-790ZM200-200v-560 560Z' />
    </svg>,
    'Note'
);

export const IconCall = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z' />
    </svg>,
    'Call'
);

export const IconCheck = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z' />
    </svg>,
    'Check'
);

export const IconAdd = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='16px' viewBox='0 -960 960 960' width='16px' fill='#1f1f1f'>
        <path d='M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z' />
    </svg>,
    'Add'
);

export const IconClose = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z' />
    </svg>,
    'Close'
);

export const IconDoneAll = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M268-240 42-466l57-56 170 170 56 56-57 56Zm226 0L268-466l56-57 170 170 368-368 56 57-424 424Zm0-226-57-56 198-198 57 56-198 198Z' />
    </svg>,
    'DoneAll'
);

export const IconPriorityHigh = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240v-480h160v480H400Z' />
    </svg>,
    'PriorityHigh'
);

export const IconExclamation = IconPriorityHigh;

export const IconLogout = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z' />
    </svg>,
    'Logout'
);

export const IconUndo = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='216x' viewBox='0 -960 960 960' width='16px' fill='#1f1f1f'>
        <path d='M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z' />
    </svg>,
    'Undo'
);

export const IconPersonAdd = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z' />
    </svg>,
    'PersonAdd'
);

export const IconMoreVertical = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z' />
    </svg>,
    'MoreVertical'
);

export const IconQrCode = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M120-520v-320h320v320H120Zm80-80h160v-160H200v160Zm-80 480v-320h320v320H120Zm80-80h160v-160H200v160Zm320-320v-320h320v320H520Zm80-80h160v-160H600v160Zm160 480v-80h80v80h-80ZM520-360v-80h80v80h-80Zm80 80v-80h80v80h-80Zm-80 80v-80h80v80h-80Zm80 80v-80h80v80h-80Zm80-80v-80h80v80h-80Zm0-160v-80h80v80h-80Zm80 80v-80h80v80h-80Z' />
    </svg>,
    'QrCode'
);

export const IconUpiAlt = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M440-360h60v-80h100q17 0 28.5-11.5T640-480v-80q0-17-11.5-28.5T600-600H440v240Zm240 0h60v-240h-60v240ZM500-500v-40h80v40h-80ZM240-360h120q17 0 28.5-11.5T400-400v-200h-60v180h-80v-180h-60v200q0 17 11.5 28.5T240-360Zm-80 200q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z' />
    </svg>,
    'UpiAlt'
);

export const IconWhatsapp = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' width='360' height='362' viewBox='0 0 360 362' fill='none'>
        <path
            d='M307.546 52.5655C273.709 18.685 228.706 0.0171895 180.756 0C81.951 0 1.53846 80.404 1.50408 179.235C1.48689 210.829 9.74646 241.667 25.4319 268.844L0 361.736L95.0236 336.811C121.203 351.096 150.683 358.616 180.679 358.625H180.756C279.544 358.625 359.966 278.212 360 179.381C360.017 131.483 341.392 86.4547 307.546 52.5741V52.5655ZM180.756 328.354H180.696C153.966 328.346 127.744 321.16 104.865 307.589L99.4242 304.358L43.034 319.149L58.0834 264.168L54.5423 258.53C39.6304 234.809 31.749 207.391 31.7662 179.244C31.8006 97.1036 98.6334 30.2707 180.817 30.2707C220.61 30.2879 258.015 45.8015 286.145 73.9665C314.276 102.123 329.755 139.562 329.738 179.364C329.703 261.513 262.871 328.346 180.756 328.346V328.354ZM262.475 216.777C257.997 214.534 235.978 203.704 231.869 202.209C227.761 200.713 224.779 199.966 221.796 204.452C218.814 208.939 210.228 219.029 207.615 222.011C205.002 225.002 202.389 225.372 197.911 223.128C193.434 220.885 179.003 216.158 161.891 200.902C148.578 189.024 139.587 174.362 136.975 169.875C134.362 165.389 136.7 162.965 138.934 160.739C140.945 158.728 143.412 155.505 145.655 152.892C147.899 150.279 148.638 148.406 150.133 145.423C151.629 142.432 150.881 139.82 149.764 137.576C148.646 135.333 139.691 113.287 135.952 104.323C132.316 95.5909 128.621 96.777 125.879 96.6309C123.266 96.5019 120.284 96.4762 117.293 96.4762C114.302 96.4762 109.454 97.5935 105.346 102.08C101.238 106.566 89.6691 117.404 89.6691 139.441C89.6691 161.478 105.716 182.785 107.959 185.776C110.202 188.767 139.544 234.001 184.469 253.408C195.153 258.023 203.498 260.782 210.004 262.845C220.731 266.257 230.494 265.776 238.212 264.624C246.816 263.335 264.71 253.786 268.44 243.326C272.17 232.866 272.17 223.893 271.053 222.028C269.936 220.163 266.945 219.037 262.467 216.794L262.475 216.777Z'
            fill='#111B21'
        />
    </svg>,
    'Whatsapp'
);

export const IconShare = createCustomSvg(
    <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
        <path d='M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm480-280q17 0 28.5-11.5T720-760q0-17-11.5-28.5T680-800q-17 0-28.5 11.5T640-760q0 17 11.5 28.5T680-720Zm0 520ZM200-480Zm480-280Z' />
    </svg>,
    'Share'
);

export const IconUpi = ({ size = 24 }: { size?: number }) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width={size}
        height={size * 0.5} // Maintain aspect ratio (2:1)
        viewBox='0 0 120 60'
        fillRule='evenodd'
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0, // Prevent icon from shrinking in flex containers
            width: size,
            height: size
        }}
    >
        <path d='M95.678 42.9L110 29.835l-6.784-13.516z' fill='#097939' />
        <path d='M90.854 42.9l14.322-13.065-6.784-13.516z' fill='#ed752e' />
        <path
            d='M22.41 16.47l-6.03 21.475 21.407.15 5.88-21.625h5.427l-7.05 25.14c-.27.96-1.298 1.74-2.295 1.74H12.31c-1.664 0-2.65-1.3-2.2-2.9l6.724-23.98zm66.182-.15h5.427l-7.538 27.03h-5.58zM49.698 27.582l27.136-.15 1.81-5.707H51.054l1.658-5.256 29.4-.27c1.83-.017 2.92 1.4 2.438 3.167L81.78 29.49c-.483 1.766-2.36 3.197-4.19 3.197H53.316L50.454 43.8h-5.28z'
            fill='#747474'
        />
    </svg>
);

export const IconFirebase = ({ size = 24 }: { size?: number }) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width={size}
        height={size}
        viewBox='0 0 600 600'
        fill='none'
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0, // Prevent icon from shrinking in flex containers
            width: size,
            height: size
        }}
    >
        <path
            d='M213.918 560.499C237.166 569.856 262.387 575.408 288.87 576.333C324.71 577.585 358.792 570.175 389.261 556.099C352.724 541.744 319.634 520.751 291.392 494.651C273.086 523.961 246.01 547.113 213.918 560.499Z'
            fill='#FF9100'
        />
        <path
            d='M291.389 494.66C226.923 435.038 187.815 348.743 191.12 254.092C191.228 251.019 191.39 247.947 191.58 244.876C180.034 241.89 167.98 240.068 155.576 239.635C137.821 239.015 120.626 241.217 104.393 245.788C87.1838 275.933 76.7989 310.521 75.5051 347.569C72.1663 443.18 130.027 526.723 213.914 560.508C246.007 547.121 273.082 523.998 291.389 494.66Z'
            fill='#FFC400'
        />
        <path
            d='M291.39 494.657C306.378 470.671 315.465 442.551 316.523 412.254C319.306 332.559 265.731 264.003 191.581 244.873C191.391 247.944 191.229 251.016 191.121 254.089C187.816 348.74 226.924 435.035 291.39 494.657Z'
            fill='#FF9100'
        />
        <path
            d='M308.231 20.8584C266 54.6908 232.652 99.302 212.475 150.693C200.924 180.129 193.665 211.748 191.546 244.893C265.696 264.023 319.272 332.579 316.489 412.273C315.431 442.57 306.317 470.663 291.355 494.677C319.595 520.804 352.686 541.77 389.223 556.124C462.56 522.224 514.593 449.278 517.606 362.997C519.558 307.096 498.08 257.273 467.731 215.219C435.68 170.742 308.231 20.8584 308.231 20.8584Z'
            fill='#DD2C00'
        />
    </svg>
);
