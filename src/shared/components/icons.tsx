import { ThemeIcon, type ThemeIconProps, useMantineTheme, parseThemeColor } from '@mantine/core';
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  variant?: 'filled' | 'outlined';
  strokeWidth?: number;
}

interface IconConfig {
  path?: string;
  svgString?: string;
  viewBox?: string;
  displayName?: string;
}

interface BaseIconProps extends IconProps {
  path?: string;
  svgString?: string;
  viewBox?: string;
}

const useIconColor = (color?: string) => {
  const theme = useMantineTheme();

  if (!color || color === 'currentColor') {
    return 'currentColor';
  }

  const parsed = parseThemeColor({ color, theme });
  return parsed.value || color;
};

const extractPathFromSvg = (svgString: string): { path: string; viewBox?: string } => {
  // Extract viewBox if present
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  const extractedViewBox = viewBoxMatch ? viewBoxMatch[1] : undefined;

  // Extract path from the first <path> element
  const pathMatch = svgString.match(/<path[^>]*d="([^"]+)"/);
  const extractedPath = pathMatch ? pathMatch[1] : '';

  return {
    path: extractedPath,
    viewBox: extractedViewBox,
  };
};

export const BaseIcon: React.FC<BaseIconProps> = ({
  color,
  path,
  svgString,
  viewBox = '0 0 24 24',
  size = 24,
  ...props
}) => {
  let finalPath = path;
  let finalViewBox = viewBox;

  // If SVG string is provided, extract path and viewBox from it
  if (svgString) {
    const extracted = extractPathFromSvg(svgString);
    finalPath = extracted.path;
    finalViewBox = extracted.viewBox || viewBox;
  }

  const resolvedColor = useIconColor(color);

  props.style = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // Prevent icon from shrinking in flex containers
    ...props.style,
  };

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox={finalViewBox}
      fill={resolvedColor}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
      }}
      {...props}>
      <path d={finalPath} />
    </svg>
  );
};

/**
 * Factory function to create optimized SVG icons
 * Returns memoized components for better performance
 */
const createIcon = (config: IconConfig): React.FC<IconProps> => {
  const { path, svgString, viewBox = '0 -960 960 960', displayName } = config;

  const IconComponent = (props: IconProps) => (
    <BaseIcon path={path} svgString={svgString} viewBox={viewBox} {...props} />
  );

  // Set display name for better debugging
  if (displayName) {
    IconComponent.displayName = displayName;
  }

  return IconComponent;
};

/**
 * Custom ThemeIcon component that accepts an icon prop
 * Optimized with React.memo for better performance
 */
interface MyThemeIconProps extends Omit<ThemeIconProps, 'children'> {
  icon: React.FC<IconProps>;
  iconSize?: string;
}

export const MyThemeIcon: React.FC<MyThemeIconProps> = ({ icon: IconComponent, iconSize = '100%', ...props }) => {
  const iconStyle = {
    width: iconSize,
    height: iconSize,
  };

  props.style = {
    ...props.style,
    display: 'inline-block',
    verticalAlign: 'text-top', // Adjust for better vertical alignment
  };

  return (
    <ThemeIcon {...props}>
      <IconComponent style={iconStyle} />
    </ThemeIcon>
  );
};

MyThemeIcon.displayName = 'MyThemeIcon';

// Icon definitions using the factory
export const IconBed = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M96-276v-180q0-26 12.5-49t35.5-34v-85q0-40 28-68t68-28h180q17.16 0 32.08 5.5Q467-709 480-698q13-11 27.92-16.5Q522.84-720 540-720h180q40 0 68 28t28 68v85q23 11 35.5 34t12.5 49v180q0 15.3-10.29 25.65Q843.42-240 828.21-240t-25.71-10.35Q792-260.7 792-276v-36H168v35.79q0 15.21-10.29 25.71t-25.5 10.5q-15.21 0-25.71-10.35T96-276Zm420-276h228v-72q0-10.2-6.9-17.1-6.9-6.9-17.1-6.9H540q-10.2 0-17.1 6.9-6.9 6.9-6.9 17.1v72Zm-300 0h228v-72q0-10.2-6.9-17.1-6.9-6.9-17.1-6.9H240q-10.2 0-17.1 6.9-6.9 6.9-6.9 17.1v72Zm-48 168h624v-72q0-10.2-6.9-17.1-6.9-6.9-17.1-6.9H192q-10.2 0-17.1 6.9-6.9 6.9-6.9 17.1v72Zm624 0H168h624Z"/></svg>',
  displayName: 'Floor',
});

export const IconPhone = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M763-145q-121-9-229.5-59.5T339-341q-86-86-135.5-194T144-764q-2-21 12.29-36.5Q170.57-816 192-816h136q17 0 29.5 10.5T374-779l24 106q2 13-1.5 25T385-628l-97 98q20 38 46 73t57.97 65.98Q422-361 456-335.5q34 25.5 72 45.5l99-96q8-8 20-11.5t25-1.5l107 23q17 5 27 17.5t10 29.5v136q0 21.43-16 35.71Q784-143 763-145ZM255-600l70-70-17.16-74H218q5 38 14 73.5t23 70.5Zm344 344q35.1 14.24 71.55 22.62Q707-225 744-220v-90l-75-16-70 70ZM255-600Zm344 344Z"/></svg>',
  displayName: 'Phone',
});

export const IconCalendarMonth = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M216-96q-29.7 0-50.85-21.5Q144-139 144-168v-528q0-29 21.15-50.5T216-768h72v-60q0-15.3 10.29-25.65Q308.58-864 323.79-864t25.71 10.35Q360-843.3 360-828v60h240v-60q0-15.3 10.29-25.65Q620.58-864 635.79-864t25.71 10.35Q672-843.3 672-828v60h72q29.7 0 50.85 21.5Q816-725 816-696v528q0 29-21.15 50.5T744-96H216Zm0-72h528v-360H216v360Zm0-432h528v-96H216v96Zm0 0v-96 96Zm264.21 216q-15.21 0-25.71-10.29t-10.5-25.5q0-15.21 10.29-25.71t25.5-10.5q15.21 0 25.71 10.29t10.5 25.5q0 15.21-10.29 25.71t-25.5 10.5Zm-156 0q-15.21 0-25.71-10.29t-10.5-25.5q0-15.21 10.29-25.71t25.5-10.5q15.21 0 25.71 10.29t10.5 25.5q0 15.21-10.29 25.71t-25.5 10.5Zm312 0q-15.21 0-25.71-10.29t-10.5-25.5q0-15.21 10.29-25.71t25.5-10.5q15.21 0 25.71 10.29t10.5 25.5q0 15.21-10.29 25.71t-25.5 10.5Zm-156 144q-15.21 0-25.71-10.29t-10.5-25.5q0-15.21 10.29-25.71t25.5-10.5q15.21 0 25.71 10.29t10.5 25.5q0 15.21-10.29 25.71t-25.5 10.5Zm-156 0q-15.21 0-25.71-10.29t-10.5-25.5q0-15.21 10.29-25.71t25.5-10.5q15.21 0 25.71 10.29t10.5 25.5q0 15.21-10.29 25.71t-25.5 10.5Zm312 0q-15.21 0-25.71-10.29t-10.5-25.5q0-15.21 10.29-25.71t25.5-10.5q15.21 0 25.71 10.29t10.5 25.5q0 15.21-10.29 25.71t-25.5 10.5Z"/></svg>',
  displayName: 'Month',
});

export const IconUniversalCurrency = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M168-192q-29.7 0-50.85-21.15Q96-234.3 96-264v-432q0-29.7 21.15-50.85Q138.3-768 168-768h624q29.7 0 50.85 21.15Q864-725.7 864-696v432q0 29.7-21.15 50.85Q821.7-192 792-192H168Zm0-72h624v-432H168v432Zm528-96h-96q-10.4 0-17.2 6.8-6.8 6.8-6.8 17.2 0 10.4 6.8 17.2 6.8 6.8 17.2 6.8h108q15.3 0 25.65-10.35Q744-332.7 744-348v-108q0-10.4-6.8-17.2-6.8-6.8-17.2-6.8-10.4 0-17.2 6.8-6.8 6.8-6.8 17.2v96Zm-216 0q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM264-600h96q10.4 0 17.2-6.8 6.8-6.8 6.8-17.2 0-10.4-6.8-17.2-6.8-6.8-17.2-6.8H252q-15.3 0-25.65 10.35Q216-627.3 216-612v108q0 10.4 6.8 17.2 6.8 6.8 17.2 6.8 10.4 0 17.2-6.8 6.8-6.8 6.8-17.2v-96Zm-96 336v-432 432Z"/></svg>',
  displayName: 'Payment Arrow Down',
});

export const IconPayments = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M552-432q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm-288 96q-29.7 0-50.85-21.17Q192-378.33 192-408.06v-288.22Q192-726 213.15-747T264-768h576q29.7 0 50.85 21.17Q912-725.67 912-695.94v288.22Q912-378 890.85-357T840-336H264Zm72-72h432q0-30 21.15-51.12 21.15-21.11 50.85-21.11V-624q-29.7 0-50.85-21.15Q768-666.3 768-696H336q0 30-21.15 51.12-21.15 21.11-50.85 21.11V-480q29.7 0 50.85 21.15Q336-437.7 336-408Zm420 216H120q-29.7 0-50.85-21.15Q48-234.3 48-264v-372q0-15.3 10.29-25.65Q68.58-672 83.79-672t25.71 10.35Q120-651.3 120-636v372h636q15.3 0 25.65 10.29Q792-243.42 792-228.21t-10.35 25.71Q771.3-192 756-192ZM264-408v-288 288Z"/></svg>',
  displayName: 'Payments',
});

export const IconRupee = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M536-155 297.84-398.25Q293-403 290.5-409.56q-2.5-6.57-2.5-13.57v-21q0-14.87 10.35-25.37Q308.7-480 324-480h96q50 0 89-35.5t43-84.5H300.23q-15.4 0-25.81-10.29Q264-620.58 264-635.79t10.3-25.71q10.29-10.5 25.52-10.5H538q-19-35-49.43-53.5Q458.15-744 420-744H299.62q-14.62 0-25.12-10.29-10.5-10.29-10.5-25.5t10.34-25.71q10.34-10.5 25.63-10.5h359.74q15.29 0 25.79 10.29t10.5 25.5q0 15.21-10.35 25.71T660-744h-84q13 17 23.5 33.5T615-672h45q15.3 0 25.65 10.29Q696-651.42 696-636.21t-10.35 25.71Q675.3-600 660-600h-36q-5 81-64 136.5T420-408h-31l199 203q17 17 7.39 39-9.6 22-33.39 22-8 0-14.5-3t-11.5-8Z"/></svg>',
  displayName: 'Rupee',
});

export const IconWifi = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M480-144q-40 0-68-28t-28-68q0-40 28-68t68-28q40 0 68 28t28 68q0 40-28 68t-68 28Zm0-432q77 0 145.5 24T751-486q16 12 17.5 32T756-420q-14 14-34 15t-37-10q-44-31-96-48t-109-17q-57 0-109 17t-96 48q-17 11-37 10t-34-15q-14-14-12.5-34t17.5-32q57-42 125.5-66T480-576Zm0-240q126 0 238 41.5T921-658q16 14 17.5 34T926-590q-15 15-36 14.5T852-590q-78-61-172-95.5T480-720q-106 0-200 34.5T108-590q-17 14-38 15t-36-14q-14-14-12.5-34.5T39-658q91-75 203-116.5T480-816Z"/></svg>',
  displayName: 'Wifi',
});

export const IconBulb = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M479.79-96Q450-96 429-117.15T408-168h144q0 30-21.21 51t-51 21ZM372.28-216q-15.28 0-25.78-10.29-10.5-10.29-10.5-25.5t10.34-25.71q10.34-10.5 25.62-10.5h215.76q15.28 0 25.78 10.29 10.5 10.29 10.5 25.5t-10.34 25.71Q603.32-216 588.04-216H372.28ZM321-336q-62-38-95.5-102.5T192-576q0-120 84-204t204-84q120 0 204 84t84 204q0 73-33.5 137.5T639-336H321Zm23-72h272q38-31 59-75t21-93q0-90.33-62.77-153.16-62.77-62.84-153-62.84Q390-792 327-729.16 264-666.33 264-576q0 49 21 93t59 75Zm136 0Z"/></svg>',
  displayName: 'Bulb',
});

export const IconRupeeCircle = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M569-274q11-10 11.5-25t-10.23-25.66L462-438l2-5h9q54 0 87.5-31.5T601-549h19q10 0 16.5-7t6.5-17q0-10-6.5-16.5T620-596h-18.86Q598-610 591-623.5T573-649h47q10 0 16.5-7t6.5-17q0-10-6.5-16.5T620-696H345.44q-11.77 0-20.11 8.21Q317-679.59 317-668q0 12 8.21 20 8.2 8 19.79 8h125.34q25.66 0 41.16 13 15.5 13 22.5 31H340q-10 0-16.5 7t-6.5 17q0 10 6.5 16.5T340-549h195q-6 20-22.73 33.5T467-502h-75q-11.78 0-20.39 6-8.61 6-12.61 15t-3 19.5q1 10.5 9 19.5l152.81 166.81Q528-264 543-264q15 0 26-10ZM480.28-96Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-312Z"/></svg>',
  displayName: 'RupeeCircle',
});

export const IconMoneyBag = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M349-144q-85 0-145-60t-60-144.65q0-35.35 11.44-68.5T188-477l130-165-51.44-123.79Q259-784 269.34-800t31.02-16H660q20.5 0 30.75 16t2.56 34.21L641-642l131 165q21.12 26.71 32.56 59.86Q816-383.99 816-349q0 85-59.79 145T611-144H349Zm130.75-180q-34.75 0-59.25-24.75t-24.5-59.5q0-34.75 24.75-59.25t59.5-24.5q34.75 0 59.25 24.75t24.5 59.5q0 34.75-24.75 59.25t-59.5 24.5ZM384-672h192l30-72H354l30 72Zm-35 456h262q55 0 94-39t39-93.89q0-23.11-7.5-44.11T715-432L583-600H377L245-432q-14 18-21.5 39t-7.5 44.11Q216-294 255-255t94 39Z"/></svg>',
  displayName: 'MoneyBag',
});

export const IconNotes = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M180.29-264q-15.29 0-25.79-10.29t-10.5-25.5q0-15.21 10.34-25.71t25.63-10.5h359.74q15.29 0 25.79 10.29t10.5 25.5q0 15.21-10.34 25.71T540.03-264H180.29ZM180-444q-15.3 0-25.65-10.29Q144-464.58 144-479.79t10.35-25.71Q164.7-516 180-516h600q15.3 0 25.65 10.29Q816-495.42 816-480.21t-10.35 25.71Q795.3-444 780-444H180Zm0-180q-15.3 0-25.65-10.29Q144-644.58 144-659.79t10.35-25.71Q164.7-696 180-696h600q15.3 0 25.65 10.29Q816-675.42 816-660.21t-10.35 25.71Q795.3-624 780-624H180Z"/></svg>',
  displayName: 'Notes',
});

export const IconClose = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M480-429 316-265q-11 11-25 10.5T266-266q-11-11-11-25.5t11-25.5l163-163-164-164q-11-11-10.5-25.5T266-695q11-11 25.5-11t25.5 11l163 164 164-164q11-11 25.5-11t25.5 11q11 11 11 25.5T695-644L531-480l164 164q11 11 11 25t-11 25q-11 11-25.5 11T644-266L480-429Z"/></svg>',
  displayName: 'Close',
});

export const IconCheck = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="m389-369 299-299q10.91-11 25.45-11Q728-679 739-668t11 25.58q0 14.58-10.61 25.19L415-292q-10.91 11-25.45 11Q375-281 364-292L221-435q-11-11-11-25.5t11-25.5q11-11 25.67-11 14.66 0 25.33 11l117 117Z"/></svg>',
  displayName: 'Check',
});

export const IconDoneAll = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M125-456q-11-11-11-25.5t11-25.5q11-11 25.5-11t25.5 11l117 117 13 13 13 13q11 11 11 25.5T319-313q-11 11-25.5 11T268-313L125-456Zm372 66 299-299q11-11 25.5-11t25.5 11q11 11 11 25.5T847-638L522-313q-11 11-25.5 10.5T471-314L329-457q-11-11-11-25t11-25q11-11 25.5-11t25.5 11l117 117Zm146-248L522-517q-11 11-25 11t-25-11q-11-11-11-25.5t11-25.5l120-121q11-11 25.5-11t25.5 11q11 11 11 25.5T643-638Z"/></svg>',
  displayName: 'DoneAll',
});

export const IconSendMoney = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M120-480q0 68 37 123t99 78q13 5 19.5 17.5T277-235q-5 14-17.5 21.5T233-211q-82-32-133.5-105T48-480q0-91 50.5-163.5T231-748q14-5 27 2.5t18 21.5q5 14-1.5 26.5T254-680q-60 24-97 78.5T120-480Zm456 288q-120 0-204-84t-84-204q0-120 84-204t204-84q48 0 93 15.5t83 44.5q12 9 12.5 23.5T754-659q-11 11-25.5 11.5T701-656q-28-20-59.5-30T576-696q-90 0-153 63t-63 153q0 90 63 153t153 63q34 0 65.5-10t59.5-30q13-9 27.5-9t25.5 11q11 11 10.5 26T752-252q-38 29-83 44.5T576-192Zm246-252H576q-15 0-25.5-10.5T540-480q0-15 10.5-25.5T576-516h246l-32-32q-11-11-11-25.5t11-25.5q11-11 25.5-11t25.5 11l94 94q11 11 11 25t-11 25l-94 94q-11 11-25 10.5T791-362q-11-11-11-25.5t11-25.5l31-31Z"/></svg>',
  displayName: 'SendMoney',
});

export const IconLogout = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M216-144q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h228q15.3 0 25.65 10.29Q480-795.42 480-780.21t-10.35 25.71Q459.3-744 444-744H216v528h228q15.3 0 25.65 10.29Q480-195.42 480-180.21t-10.35 25.71Q459.3-144 444-144H216Zm462-300H419.96q-15.28 0-25.62-10.29Q384-464.58 384-479.79t10.34-25.71q10.34-10.5 25.62-10.5H678l-56-56q-11-11-11-25.57t11-25.5Q633-634 647.5-634t25.5 11l118 118q11 10.64 11 24.82T791-455L673-337q-11 11-25 10.5T622.52-338Q612-349 612-363.5t11-25.5l55-55Z"/></svg>',
  displayName: 'Logout',
});

export const IconSearch = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M384.03-336Q284-336 214-406t-70-170q0-100 70-170t170-70q100 0 170 70t70 170.03q0 40.39-12.5 76.18Q599-464 577-434l214 214q11 11 11 25t-11 25q-11 11-25.5 11T740-170L526-383q-30 22-65.79 34.5-35.79 12.5-76.18 12.5Zm-.03-72q70 0 119-49t49-119q0-70-49-119t-119-49q-70 0-119 49t-49 119q0 70 49 119t119 49Z"/></svg>',
  displayName: 'Search',
});

export const IconFilter = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M420-264q-15.3 0-25.65-10.29Q384-284.58 384-299.79t10.35-25.71Q404.7-336 420-336h120q15.3 0 25.65 10.29Q576-315.42 576-300.21t-10.35 25.71Q555.3-264 540-264H420ZM276-444q-15.3 0-25.65-10.29Q240-464.58 240-479.79t10.35-25.71Q260.7-516 276-516h408q15.3 0 25.65 10.29Q720-495.42 720-480.21t-10.35 25.71Q699.3-444 684-444H276Zm-96-180q-15.3 0-25.65-10.29Q144-644.58 144-659.79t10.35-25.71Q164.7-696 180-696h600q15.3 0 25.65 10.29Q816-675.42 816-660.21t-10.35 25.71Q795.3-624 780-624H180Z"/></svg>',
  displayName: 'Filter',
});

export const IconPersonAdd = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M708-516h-48q-15.3 0-25.65-10.29Q624-536.58 624-551.79t10.35-25.71Q644.7-588 660-588h48v-48q0-15.3 10.29-25.65Q728.58-672 743.79-672t25.71 10.35Q780-651.3 780-636v48h48q15.3 0 25.65 10.29Q864-567.42 864-552.21t-10.35 25.71Q843.3-516 828-516h-48v48q0 15.3-10.29 25.65Q759.42-432 744.21-432t-25.71-10.35Q708-452.7 708-468v-48Zm-324 36q-60 0-102-42t-42-102q0-60 42-102t102-42q60 0 102 42t42 102q0 60-42 102t-102 42ZM96-264v-20q0-25.78 12.5-47.39T143-366q55-32 116-49t125-17q64 0 125 17t116 49q22 13 34.5 34.61T672-284v20q0 29.7-21.16 50.85Q629.68-192 599.96-192H167.72Q138-192 117-213.15T96-264Zm72 0h432v-20q0-6.47-3.03-11.76-3.02-5.3-7.97-8.24-47-27-99-41.5T384-360q-54 0-106 14.5T179-304q-4.95 2.94-7.98 8.24Q168-290.47 168-284v20Zm216.21-288Q414-552 435-573.21t21-51Q456-654 434.79-675t-51-21Q354-696 333-674.79t-21 51Q312-594 333.21-573t51 21Zm-.21-73Zm0 361Z"/></svg>',
  displayName: 'PersonAdd',
});

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
      height: size,
    }}>
    <path d='M95.678 42.9L110 29.835l-6.784-13.516z' fill='#097939' />
    <path d='M90.854 42.9l14.322-13.065-6.784-13.516z' fill='#ed752e' />
    <path
      d='M22.41 16.47l-6.03 21.475 21.407.15 5.88-21.625h5.427l-7.05 25.14c-.27.96-1.298 1.74-2.295 1.74H12.31c-1.664 0-2.65-1.3-2.2-2.9l6.724-23.98zm66.182-.15h5.427l-7.538 27.03h-5.58zM49.698 27.582l27.136-.15 1.81-5.707H51.054l1.658-5.256 29.4-.27c1.83-.017 2.92 1.4 2.438 3.167L81.78 29.49c-.483 1.766-2.36 3.197-4.19 3.197H53.316L50.454 43.8h-5.28z'
      fill='#747474'
    />
  </svg>
);

export const IconQrCode = createIcon({
  svgString:
    '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1f1f1f"><path d="M504-144v-72h72v72h-72Zm-72-72v-192h72v192h-72Zm312-120v-144h72v144h-72Zm-72-144v-72h72v72h-72Zm-456 72v-72h72v72h-72Zm-72-72v-72h72v72h-72Zm336-264v-72h72v72h-72Zm-288 96h120v-120H192v120Zm-48 12.06v-143.78q0-15.28 10.33-25.78 10.34-10.5 25.61-10.5h143.78q15.28 0 25.78 10.33 10.5 10.34 10.5 25.61v143.78q0 15.28-10.33 25.78-10.34 10.5-25.61 10.5H180.28q-15.28 0-25.78-10.33-10.5-10.34-10.5-25.61ZM192-192h120v-120H192v120Zm-48 12.06v-143.78q0-15.28 10.33-25.78 10.34-10.5 25.61-10.5h143.78q15.28 0 25.78 10.33 10.5 10.34 10.5 25.61v143.78q0 15.28-10.33 25.78-10.34 10.5-25.61 10.5H180.28q-15.28 0-25.78-10.33-10.5-10.34-10.5-25.61ZM648-648h120v-120H648v120Zm-48 12.06v-143.78q0-15.28 10.33-25.78 10.34-10.5 25.61-10.5h143.78q15.28 0 25.78 10.33 10.5 10.34 10.5 25.61v143.78q0 15.28-10.33 25.78-10.34 10.5-25.61 10.5H636.28q-15.28 0-25.78-10.33-10.5-10.34-10.5-25.61ZM672-144v-120h-72v-72h144v120h72v72H672ZM504-408v-72h168v72H504Zm-144 0v-72h-72v-72h216v72h-72v72h-72Zm48-192v-144h72v72h72v72H408Zm-180-84v-48h48v48h-48Zm0 456v-48h48v48h-48Zm456-456v-48h48v48h-48Z"/></svg>',
  displayName: 'QrCode',
});

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
      height: size,
    }}>
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


interface AddressBookIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

export function AddressBookIcon({ size, style, ...others }: AddressBookIconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
      viewBox='0 0 24 24'
      style={{ width: size, height: size, ...style }}
      {...others}>
      <path stroke='none' d='M0 0h24v24H0z' />
      <path d='M20 6v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2zM10 16h6' />
      <path d='M11 11a2 2 0 104 0 2 2 0 10-4 0M4 8h3M4 12h3M4 16h3' />
    </svg>
  );
}
