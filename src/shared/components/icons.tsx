// import { ThemeIcon, type ThemeIconProps, useMantineTheme, parseThemeColor } from '@mantine/core';
// import React, { Children, isValidElement, type JSX, type SVGProps } from 'react';

// interface IconProps extends React.SVGProps<SVGSVGElement> {
//   size?: number | string;
//   color?: string;
//   variant?: 'filled' | 'outlined';
//   strokeWidth?: number;
// }

// interface IconConfig {
//   path?: string;
//   svgString?: string;
//   viewBox?: string;
//   displayName?: string;
// }

// interface BaseIconProps extends IconProps {
//   path?: string;
//   svgString?: string;
//   viewBox?: string;
// }

// const useIconColor = (color?: string) => {
//   const theme = useMantineTheme();

//   if (!color || color === 'currentColor') {
//     return 'currentColor';
//   }

//   const parsed = parseThemeColor({ color, theme });
//   return parsed.value || color;
// };

// const extractPathFromSvg = (svgString: string): { path: string; viewBox?: string } => {
//   // Extract viewBox if present
//   const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
//   const extractedViewBox = viewBoxMatch ? viewBoxMatch[1] : undefined;

//   // Extract path from the first <path> element
//   const pathMatch = svgString.match(/<path[^>]*d="([^"]+)"/);
//   const extractedPath = pathMatch ? pathMatch[1] : '';

//   return {
//     path: extractedPath,
//     viewBox: extractedViewBox,
//   };
// };

// export const BaseIcon: React.FC<BaseIconProps> = ({
//   color,
//   path,
//   svgString,
//   viewBox = '0 0 24 24',
//   size = 24,
//   ...props
// }) => {
//   let finalPath = path;
//   let finalViewBox = viewBox;

//   // If SVG string is provided, extract path and viewBox from it
//   if (svgString) {
//     const extracted = extractPathFromSvg(svgString);
//     finalPath = extracted.path;
//     finalViewBox = extracted.viewBox || viewBox;
//   }

//   const resolvedColor = useIconColor(color);

//   props.style = {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexShrink: 0, // Prevent icon from shrinking in flex containers
//     ...props.style,
//   };

//   return (
//     <svg
//       xmlns='http://www.w3.org/2000/svg'
//       width={size}
//       height={size}
//       viewBox={finalViewBox}
//       fill={resolvedColor}
//       style={{
//         width: size,
//         height: size,
//         flexShrink: 0,
//       }}
//       {...props}>
//       <path d={finalPath} />
//     </svg>
//   );
// };

// /**
//  * Factory function to create optimized SVG icons
//  * Returns memoized components for better performance
//  */
// const createIcon = (config: IconConfig): React.FC<IconProps> => {
//   const { path, svgString, viewBox = '0 -960 960 960', displayName } = config;

//   const IconComponent = (props: IconProps) => (
//     <BaseIcon path={path} svgString={svgString} viewBox={viewBox} {...props} />
//   );

//   // Set display name for better debugging
//   if (displayName) {
//     IconComponent.displayName = displayName;
//   }

//   return IconComponent;
// };

// /**
//  * Custom ThemeIcon component that accepts an icon prop
//  * Optimized with React.memo for better performance
//  */
// interface MyThemeIconProps extends Omit<ThemeIconProps, 'children'> {
//   icon: React.FC<IconProps>;
//   iconSize?: string;
// }

// export const MyThemeIcon: React.FC<MyThemeIconProps> = ({ icon: IconComponent, iconSize = '100%', ...props }) => {
//   const iconStyle = {
//     width: iconSize,
//     height: iconSize,
//   };

//   props.style = {
//     ...props.style,
//   };

//   return (
//     <ThemeIcon {...props}>
//       <IconComponent style={iconStyle} />
//     </ThemeIcon>
//   );
// };

// MyThemeIcon.displayName = 'MyThemeIcon';


// // Define the custom props for your new component.
// interface CustomIconProps extends SVGProps<SVGSVGElement> {
//   size?: number | string;
// }

// const createCustomSvg = (svg: React.ReactElement<CustomIconProps, 'svg'>, displayName: string) => {
//   // Extract the original path elements from the source SVG.
//   // We use Children.map to get a new array of the children.
//   const pathElements =
//     Children.map(svg.props.children, (child) => {
//       // Only return the path elements, as we are recreating the parent SVG.
//       if (isValidElement(child) && child.type === 'path') {
//         return child;
//       }
//       return null; // Exclude non-path children if any exist.
//     })?.filter(Boolean) || [];

//   // Return a new functional component that renders the customized SVG.
//   const CustomIcon = ({ size = '24', style, ...others }: CustomIconProps) => {
//     // Return the new SVG element with our custom props and the extracted paths.
//     return (
//       <svg
//         xmlns='http://www.w3.org/2000/svg'
//         height={size}
//         width={size}
//         // Retain original viewBox if no new viewBox is provided.
//         viewBox={svg.props.viewBox || '0 0 24 24'}
//         fill='currentColor' // Use currentColor to inherit the parent color.
//         style={{ display: 'block', lineHeight: 1, whiteSpace: 'nowrap', wordWrap: 'normal', ...style }}
//         {...others}>
//         {pathElements}
//       </svg>
//     );
//   };
//   // Add the displayName property to the CustomIcon component after its definition.
//   CustomIcon.displayName = displayName;
//   return CustomIcon;
// };

// export function IconInfo({ size = '24px', color, style, ...others }: IconProps) {
//   return (
//     <svg
//       xmlns='http://www.w3.org/2000/svg'
//       height={size}
//       width={size}
//       viewBox='0 -960 960 960'
//       fill={useIconColor(color)}
//       style={{ ...style }}
//       {...others}>
//       <path d='M480-680q-33 0-56.5-23.5T400-760q0-33 23.5-56.5T480-840q33 0 56.5 23.5T560-760q0 33-23.5 56.5T480-680Zm-60 560v-480h120v480H420Z' />
//     </svg>
//   );
// }

// export const IconRupee = createCustomSvg(
//   <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
//     <path d='M549-120 280-400v-80h140q53 0 91.5-34.5T558-600H240v-80h306q-17-35-50.5-57.5T420-760H240v-80h480v80H590q14 17 25 37t17 43h88v80h-81q-8 85-70 142.5T420-400h-29l269 280H549Z' />
//   </svg>,
//   'IconRupee'
// );

// export const IconInfoCircle = createCustomSvg(
//   <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
//     <path d='M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z' />
//   </svg>,
//   'IconInfoCircle'
// );

// export const IconMore = createCustomSvg(
//   <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
//     <path d='M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z' />
//   </svg>,
//   'IconMore'
// );

// export const IconBack = createCustomSvg(
//   <svg xmlns='http://www.w3.org/2000/svg' height='16px' viewBox='0 -960 960 960' width='16px' fill='#1f1f1f'>
//     <path d='m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z' />
//   </svg>,
//   'IconBack'
// );

// export const IconCall = createCustomSvg(
//   <svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='#1f1f1f'>
//     <path d='M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z' />
//   </svg>,
//   'IconCall'
// );
